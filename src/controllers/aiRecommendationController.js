// controllers/aiRecommendationController.js
const { Op, fn, col, literal } = require('sequelize');
const {
  Book, Author, Category, Publisher,
  Department, MaterialType, Download, User,
} = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, NotFoundError } = require('../utils/errors');

// ── Gemini API 
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ── In-memory cache (TTL = 5 minutes) 
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    cache.delete(oldest[0]);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

// ── Shared BOOK_INCLUDE ─
const BOOK_INCLUDE = [
  { model: Category, as: 'Category', attributes: ['id', 'name', 'nameKh'] },
  { model: Publisher, as: 'Publisher', attributes: ['id', 'name', 'nameKh'] },
  { model: Department, as: 'Department', attributes: ['id', 'name', 'code'] },
  { model: MaterialType, as: 'MaterialType', attributes: ['id', 'name', 'nameKh'] },
  {
    model: Author, as: 'Authors',
    attributes: ['id', 'name', 'nameKh'],
    through: { attributes: ['isPrimaryAuthor'] },
  },
];

// ── Call Gemini — returns parsed JSON array 
async function callGemini(prompt, maxTokens = 1500) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not configured in environment');

  let response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens,
          topK: 40,
          topP: 0.95,
        },
      }),
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching Gemini API: ${networkErr.message}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw new Error('AI service rate limit reached — please try again in a moment');
    }
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // If AI returned multiple lines or wrapped text, try to extract first JSON array
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    throw new Error(`Failed to parse AI response as JSON: ${rawText.slice(0, 300)}`);
  }
}

// ── Call Gemini — returns plain text (for chat) 
async function callGeminiText(prompt, maxTokens = 800) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not configured in environment');

  let response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: maxTokens },
      }),
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching Gemini API: ${networkErr.message}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw new Error('AI service rate limit reached — please try again in a moment');
    }
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── Match AI suggestions → real DB books ──
async function matchBooksFromDB(aiSuggestions) {
  if (!Array.isArray(aiSuggestions) || !aiSuggestions.length) return [];

  const titleConditions = aiSuggestions
    .filter((s) => s && s.title)
    .map((s) => ({ title: { [Op.iLike]: `%${s.title}%` } }));

  if (!titleConditions.length) return [];

  const dbBooks = await Book.findAll({
    where: { isDeleted: false, isActive: true, [Op.or]: titleConditions },
    include: BOOK_INCLUDE,
    limit: 10,
  });

  return dbBooks.map((book) => {
    const match = aiSuggestions.find(
      (s) => s.title && book.title.toLowerCase().includes(s.title.toLowerCase())
    );
    return { ...book.toJSON(), aiReason: match?.reason ?? null };
  });
}

class AIRecommendationController {

  // ── GET /api/ai/recommendations?category=Programming 
  static async byCategory(req, res, next) {
    try {
      const { category } = req.query;
      if (!category || !String(category).trim()) {
        throw new ValidationError('category query param is required');
      }

      const cacheKey = `cat:${String(category).toLowerCase()}`;
      const cached = getCached(cacheKey);
      if (cached) return ResponseFormatter.success(res, { ...cached, cached: true });

      // Fetch DB books in this category to ground the AI
      const dbBooks = await Book.findAll({
        where: { isDeleted: false, isActive: true },
        include: [
          {
            model: Category,
            as: 'Category',
            where: { name: { [Op.iLike]: `%${category}%` } },
            attributes: ['name'],
          },
          {
            model: Author, as: 'Authors',
            attributes: ['name'],
            through: { attributes: [] },
          },
        ],
        attributes: ['id', 'title', 'publicationYear'],
        limit: 50,
      });

      const bookList = dbBooks.map((b) => ({
        title: b.title,
        author: b.Authors?.[0]?.name ?? 'Unknown',
      }));

      const prompt = bookList.length
        ? `You are a knowledgeable librarian AI for a university e-library system.
A student wants books in the category: "${category}".

Available books in the library:
${bookList.map((b, i) => `${i + 1}. "${b.title}" by ${b.author}`).join('\n')}

From the list above, recommend the 6 best books for this category.
Only recommend books from the list.
Return ONLY a valid JSON array, no markdown, no extra text:
[{"title":"...","author":"...","reason":"one sentence why this book is great for ${category}"}]`
        : `You are a knowledgeable librarian AI. Recommend 6 great books in the "${category}" category.
Return ONLY a valid JSON array, no markdown, no extra text:
[{"title":"...","author":"...","reason":"one sentence why this book is valuable"}]`;

      const aiSuggestions = await callGemini(prompt);
      const matched = bookList.length ? await matchBooksFromDB(aiSuggestions) : [];

      const result = {
        source: matched.length ? 'library' : 'ai-general',
        category,
        recommendations: matched.length ? matched : aiSuggestions,
        total: matched.length || aiSuggestions.length,
      };
      setCache(cacheKey, result);
      return ResponseFormatter.success(res, result);
    } catch (err) { next(err); }
  }

  // ── GET /api/ai/recommendations?bookTitle=Clean+Code 
  static async byBook(req, res, next) {
    try {
      const { bookTitle } = req.query;
      if (!bookTitle || !String(bookTitle).trim()) {
        throw new ValidationError('bookTitle query param is required');
      }

      const cacheKey = `book:${String(bookTitle).toLowerCase()}`;
      const cached = getCached(cacheKey);
      if (cached) return ResponseFormatter.success(res, { ...cached, cached: true });

      // Find source book in DB
      const sourceBook = await Book.findOne({
        where: { title: { [Op.iLike]: `%${bookTitle}%` }, isDeleted: false },
        include: [
          { model: Category, as: 'Category', attributes: ['id', 'name'] },
          { model: Author, as: 'Authors', attributes: ['name'], through: { attributes: [] } },
        ],
      });

      // Get sibling books in the same category
      let siblingBooks = [];
      if (sourceBook?.categoryId) {
        const siblings = await Book.findAll({
          where: {
            isDeleted: false,
            isActive: true,
            categoryId: sourceBook.categoryId,
            id: { [Op.ne]: sourceBook.id },
          },
          include: [{
            model: Author, as: 'Authors',
            attributes: ['name'],
            through: { attributes: [] },
          }],
          attributes: ['title'],
          limit: 40,
        });
        siblingBooks = siblings.map((b) => ({
          title: b.title,
          author: b.Authors?.[0]?.name ?? 'Unknown',
        }));
      }

      const prompt = siblingBooks.length
        ? `You are a knowledgeable librarian AI for a university e-library system.
A student loved the book: "${bookTitle}".
${sourceBook ? `Category: ${sourceBook.Category?.name ?? 'General'}` : ''}

Available books in the library:
${siblingBooks.map((b, i) => `${i + 1}. "${b.title}" by ${b.author}`).join('\n')}

From the list above, recommend the 5 most similar books to "${bookTitle}".
Only recommend from the list.
Return ONLY a valid JSON array, no markdown, no extra text:
[{"title":"...","author":"...","reason":"one sentence why it is similar to ${bookTitle}"}]`
        : `You are a knowledgeable librarian AI. A student loved the book: "${bookTitle}".
Recommend 5 similar books they would enjoy.
Return ONLY a valid JSON array, no markdown, no extra text:
[{"title":"...","author":"...","reason":"one sentence why it is similar"}]`;

      const aiSuggestions = await callGemini(prompt);
      const matched = siblingBooks.length ? await matchBooksFromDB(aiSuggestions) : [];

      const result = {
        source: matched.length ? 'library' : 'ai-general',
        basedOn: bookTitle,
        bookFound: !!sourceBook,
        recommendations: matched.length ? matched : aiSuggestions,
        total: matched.length || aiSuggestions.length,
      };
      setCache(cacheKey, result);
      return ResponseFormatter.success(res, result);
    } catch (err) { next(err); }
  }

  // ── GET /api/ai/recommendations?userId=current  (requires auth) 
  static async byUserHistory(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ValidationError('Authentication required for history-based recommendations');

      // BUG FIX: use Sequelize field alias 'userId' not raw 'user_id'
      const downloads = await Download.findAll({
        where: { userId },
        include: [{
          model: Book,
          as: 'Book',
          attributes: ['title'],
          include: [
            { model: Category, as: 'Category', attributes: ['name'] },
            { model: Author, as: 'Authors', attributes: ['name'], through: { attributes: [] } },
          ],
        }],
        order: [['downloadedAt', 'DESC']],
        limit: 20,
      });

      // No history → return popular books
      if (!downloads.length) {
        const popular = await Book.findAll({
          where: { isDeleted: false, isActive: true },
          include: BOOK_INCLUDE,
          order: [['views', 'DESC']],
          limit: 6,
        });
        return ResponseFormatter.success(res, {
          source: 'popular',
          message: 'No reading history found — showing most popular books',
          recommendations: popular,
          total: popular.length,
        });
      }

      const historyList = downloads.map((d) => ({
        title: d.Book?.title ?? 'Unknown',
        author: d.Book?.Authors?.[0]?.name ?? 'Unknown',
        category: d.Book?.Category?.name ?? 'General',
      }));

      // Deduplicated category list (case-insensitive)
      const categoryNames = [
        ...new Map(
          historyList
            .map((h) => h.category)
            .filter(Boolean)
            .map((c) => [c.toLowerCase(), c])
        ).values(),
      ];

      const alreadyRead = new Set(historyList.map((h) => h.title.toLowerCase()));

      // Build OR conditions for category filter
      const categoryConditions = categoryNames.map((c) => ({
        name: { [Op.iLike]: `%${c}%` },
      }));

      const candidateBooks = await Book.findAll({
        where: { isDeleted: false, isActive: true },
        include: [
          {
            model: Category,
            as: 'Category',
            where: categoryConditions.length ? { [Op.or]: categoryConditions } : undefined,
            attributes: ['name'],
          },
          { model: Author, as: 'Authors', attributes: ['name'], through: { attributes: [] } },
        ],
        attributes: ['id', 'title'],
        limit: 60,
      }).catch(() =>
        // Fallback: all active books if category filter fails
        Book.findAll({
          where: { isDeleted: false, isActive: true },
          include: [
            { model: Category, as: 'Category', attributes: ['name'] },
            { model: Author, as: 'Authors', attributes: ['name'], through: { attributes: [] } },
          ],
          attributes: ['id', 'title'],
          limit: 60,
        })
      );

      const candidates = candidateBooks
        .filter((b) => !alreadyRead.has(b.title.toLowerCase()))
        .map((b) => ({
          title: b.title,
          author: b.Authors?.[0]?.name ?? 'Unknown',
        }));

      const prompt = `You are a knowledgeable librarian AI for a university e-library system.
Here is a student's reading history:
${historyList.map((b, i) => `${i + 1}. "${b.title}" by ${b.author} [${b.category}]`).join('\n')}

${candidates.length
          ? `Available books in the library (not yet read by the student):
${candidates.map((b, i) => `${i + 1}. "${b.title}" by ${b.author}`).join('\n')}

Recommend the 6 best books from the available list based on the student's reading taste.
Only recommend from the available books list.`
          : `Recommend 6 books based on the student's reading taste.`}

Return ONLY a valid JSON array, no markdown, no extra text:
[{"title":"...","author":"...","reason":"one sentence why the student would enjoy this"}]`;

      const aiSuggestions = await callGemini(prompt);
      const matched = await matchBooksFromDB(aiSuggestions);

      return ResponseFormatter.success(res, {
        source: matched.length ? 'library' : 'ai-general',
        basedOn: 'reading-history',
        historyCount: downloads.length,
        recommendations: matched.length ? matched : aiSuggestions,
        total: matched.length || aiSuggestions.length,
      });
    } catch (err) { next(err); }
  }

  // ── POST /api/ai/recommendations/personalized 
  static async personalized(req, res, next) {
    try {
      const { readingHistory = [], categoryIds = [], bookId } = req.body;

      if (!readingHistory.length && !categoryIds.length && !bookId) {
        throw new ValidationError(
          'Provide at least one of: readingHistory, categoryIds, or bookId'
        );
      }

      // Resolve bookId → book title + category context
      let bookContext = '';
      if (bookId) {
        const book = await Book.findOne({
          where: { id: bookId, isDeleted: false },
          include: [{ model: Category, as: 'Category', attributes: ['name'] }],
          attributes: ['title'],
        });
        if (book) bookContext = `Reference book: "${book.title}" (${book.Category?.name ?? ''})`;
      }

      // Fetch candidates from requested categories (or all books)
      const categoryWhere = categoryIds.length ? { id: { [Op.in]: categoryIds } } : undefined;
      const availableBooks = await Book.findAll({
        where: { isDeleted: false, isActive: true },
        include: [
          categoryWhere
            ? { model: Category, as: 'Category', where: categoryWhere, attributes: ['name'] }
            : { model: Category, as: 'Category', attributes: ['name'] },
          { model: Author, as: 'Authors', attributes: ['name'], through: { attributes: [] } },
        ],
        attributes: ['id', 'title'],
        limit: 60,
      });

      const alreadyRead = new Set(
        readingHistory.map((h) => String(h.title ?? '').toLowerCase())
      );
      const candidates = availableBooks
        .filter((b) => !alreadyRead.has(b.title.toLowerCase()))
        .map((b) => ({
          title: b.title,
          author: b.Authors?.[0]?.name ?? 'Unknown',
          category: b.Category?.name ?? 'General',
        }));

      const historyText = readingHistory.length
        ? `Student's reading history:\n${readingHistory.map((b, i) => `${i + 1}. "${b.title}" by ${b.author}`).join('\n')}`
        : '';

      const prompt = `You are a knowledgeable librarian AI for a university e-library system.
${historyText}
${bookContext}

${candidates.length
          ? `Available books in the library:
${candidates.map((b, i) => `${i + 1}. "${b.title}" by ${b.author} [${b.category}]`).join('\n')}

Recommend 6 books from the list above that best match the student's taste.
Only recommend from the available books list.`
          : `Recommend 6 books that match the student's taste.`}

Return ONLY a valid JSON array, no markdown, no extra text:
[{"title":"...","author":"...","category":"...","reason":"one sentence why the student would love it"}]`;

      const aiSuggestions = await callGemini(prompt);
      const matched = candidates.length ? await matchBooksFromDB(aiSuggestions) : [];

      return ResponseFormatter.success(res, {
        source: matched.length ? 'library' : 'ai-general',
        recommendations: matched.length ? matched : aiSuggestions,
        total: matched.length || aiSuggestions.length,
      });
    } catch (err) { next(err); }
  }

  // ── GET /api/ai/recommendations/trending ──
  static async trending(req, res, next) {
    try {
      const cacheKey = 'trending';
      const cached = getCached(cacheKey);
      if (cached) return ResponseFormatter.success(res, { ...cached, cached: true });

      const limit = Math.min(parseInt(req.query.limit) || 6, 20);

      // Most downloaded in last 30 days
      // BUG FIX: use 'book_id' (real DB column) in attributes + group, not camelCase 'bookId'
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let topDownloaded = [];
      try {
        topDownloaded = await Download.findAll({
          where: { downloadedAt: { [Op.gte]: thirtyDaysAgo } },
          attributes: [
            'bookId',
            [fn('COUNT', col('Download.id')), 'downloadCount'],
          ],
          include: [{
            model: Book,
            as: 'Book',
            attributes: ['id', 'title'],
            where: { isDeleted: false, isActive: true },
          }],
          group: ['Download.book_id', 'Book.id'],   // ✅ real column names
          order: [[literal('downloadCount'), 'DESC']], // ✅ no double-quotes needed
          limit,
        });
      } catch (groupErr) {
        // Some DB dialects may differ — degrade gracefully to all-time views
        console.warn('[AI trending] download group query failed:', groupErr.message);
      }

      // Most viewed (all time fallback + supplement)
      const topViewed = await Book.findAll({
        where: { isDeleted: false, isActive: true },
        include: BOOK_INCLUDE,
        order: [['views', 'DESC']],
        limit,
      });

      // Merge unique books: downloads first, then views
      const seenIds = new Set();
      const merged = [];
      for (const d of topDownloaded) {
        const id = d.Book?.id;
        if (id && !seenIds.has(String(id))) {
          seenIds.add(String(id));
          merged.push({ id, title: d.Book?.title });
        }
      }
      for (const b of topViewed) {
        if (!seenIds.has(String(b.id))) {
          seenIds.add(String(b.id));
          merged.push({ id: b.id, title: b.title });
        }
      }
      const trendingCandidates = merged.slice(0, limit);

      // Ask Gemini why these books are trending
      let aiReasons = [];
      if (trendingCandidates.length) {
        const prompt = `You are a librarian AI. These books are trending in our university library this month:
${trendingCandidates.map((b, i) => `${i + 1}. "${b.title}"`).join('\n')}

For each book, write one sentence explaining why it would be trending among university students.
Return ONLY a valid JSON array, no markdown, no extra text:
[{"title":"...","reason":"one sentence why it is trending"}]`;
        try { aiReasons = await callGemini(prompt, 800); } catch { /* degrade gracefully */ }
      }

      // Fetch full enriched book records
      const bookIds = trendingCandidates.map((b) => b.id).filter(Boolean);
      const fullBooks = bookIds.length
        ? await Book.findAll({
          where: { id: { [Op.in]: bookIds }, isDeleted: false, isActive: true },
          include: BOOK_INCLUDE,
        })
        : topViewed.slice(0, limit);

      const recommendations = fullBooks.map((book) => {
        const match = Array.isArray(aiReasons)
          ? aiReasons.find((r) => r?.title && book.title.toLowerCase().includes(r.title.toLowerCase()))
          : null;
        return { ...book.toJSON(), aiReason: match?.reason ?? null };
      });

      const result = {
        source: 'trending',
        period: 'last-30-days',
        recommendations,
        total: recommendations.length,
      };
      setCache(cacheKey, result);
      return ResponseFormatter.success(res, result);
    } catch (err) { next(err); }
  }

  // ── POST /api/ai/recommendations/chat ─
  static async chat(req, res, next) {
    try {
      const { message, context = {} } = req.body;

      if (!message || !String(message).trim()) {
        throw new ValidationError('message is required');
      }
      if (String(message).trim().length > 500) {
        throw new ValidationError('message must be 500 characters or less');
      }

      const { currentBook, currentCategory } = context;

      const [totalBooks, categories] = await Promise.all([
        Book.count({ where: { isDeleted: false, isActive: true } }),
        Category.findAll({ attributes: ['name'], limit: 20 }),
      ]);

      const categoryList = categories.map((c) => c.name).join(', ');

      const prompt = `You are a helpful, friendly librarian AI assistant for Norton University's E-Library.
The library has ${totalBooks} books across categories including: ${categoryList}.
${currentBook ? `The student is currently viewing: "${currentBook}"` : ''}
${currentCategory ? `The student is browsing the "${currentCategory}" category.` : ''}

Only answer questions related to books, reading, library resources, academic topics, and study advice.
If the question is unrelated, politely redirect the student to ask about books or the library.
Keep your response concise (3-5 sentences max), helpful, and encouraging.

Student question: ${String(message).trim()}`;

      const reply = await callGeminiText(prompt, 600);

      return ResponseFormatter.success(res, {
        message: reply.trim(),
        role: 'assistant',
      });
    } catch (err) { next(err); }
  }

  // ── GET /api/ai/recommendations/similar/:bookId 
  static async similarById(req, res, next) {
    try {
      const { bookId } = req.params;

      if (!bookId || isNaN(Number(bookId))) {
        throw new ValidationError('bookId must be a valid number');
      }

      const sourceBook = await Book.findOne({
        where: { id: bookId, isDeleted: false, isActive: true },
        include: [
          { model: Category, as: 'Category', attributes: ['id', 'name'] },
          { model: Author, as: 'Authors', attributes: ['name'], through: { attributes: [] } },
        ],
      });
      if (!sourceBook) throw new NotFoundError(`Book with id=${bookId} not found`);

      // Delegate to byBook with the title set
      req.query.bookTitle = sourceBook.title;
      return AIRecommendationController.byBook(req, res, next);
    } catch (err) { next(err); }
  }
}

module.exports = AIRecommendationController;