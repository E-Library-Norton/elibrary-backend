// controllers/book.controller.js
const { Op, literal } = require('sequelize');
const { sequelize, Book, Author, Editor, Category, Publisher, MaterialType, Department, Download, Review, User } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');
const { uploadToR2 } = require('../utils/cloudR2Upload');
const { scanBookCover, syncBookCover, deleteBookCover } = require('../utils/vectorSearchService');
const { EVENTS, emitToAdmin, emitBroadcast } = require('../utils/socket');
const { broadcastNotification } = require('../utils/pushNotification');

async function validateBookClassifications(
  { categoryId, departmentId, typeId },
  { partial = false } = {}
) {
  const classifications = [
    { label: 'Category', value: categoryId, model: Category },
    { label: 'Department', value: departmentId, model: Department },
    { label: 'Material type', value: typeId, model: MaterialType },
  ];

  for (const { label, value } of classifications) {
    if (!partial && !value) throw new ValidationError(`${label} is required`);
    if (partial && value !== undefined && !value) {
      throw new ValidationError(`${label} is required`);
    }
  }

  const supplied = classifications.filter(({ value }) => Boolean(value));
  const records = await Promise.all(
    supplied.map(({ model, value }) => model.findByPk(value, { attributes: ['id'] }))
  );

  records.forEach((record, index) => {
    if (!record) {
      throw new ValidationError(`Selected ${supplied[index].label.toLowerCase()} does not exist`);
    }
  });
}

// ── Shared include for full book detail 
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
  {
    model: Editor, as: 'Editors',
    attributes: ['id', 'name', 'nameKh'],
    through: { attributes: [] },
  },
  {
    model: Publisher, as: 'Publishers',
    attributes: ['id', 'name', 'nameKh'],
    through: { attributes: [] },
  },
];

// ── Rating subquery attributes (avoids N+1 for star ratings) 
const RATING_ATTRIBUTES = [
  [
    literal('(SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.book_id = "Book".id AND r.is_deleted = false)'),
    'averageRating',
  ],
  [
    literal('(SELECT COUNT(*) FROM reviews r WHERE r.book_id = "Book".id AND r.is_deleted = false)'),
    'reviewCount',
  ],
];

class BookController {

  // ── GET /api/books  (Two-query: COUNT + paginated findAll — no GROUP BY issues)
  static async getAll(req, res, next) {
    try {
      const {
        page = 1, limit = 10,
        search, categoryId, categoryName, publisherId, departmentId, typeId,
        publicationYear, yearFrom, yearTo, language, authorId,
        isActive, hasVideo, hasAudio, sortBy = 'created_at', sortOrder = 'DESC',
      } = req.query;

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const offset = (pageNum - 1) * limitNum;

      // ── Dynamic WHERE 
      const where = { isDeleted: false };

      // Resolve category: accept either categoryId (UUID) or categoryName (string)
      let resolvedCategoryId = categoryId;
      if (!resolvedCategoryId && categoryName) {
        const cat = await Category.findOne({
          where: { name: { [Op.iLike]: categoryName } },
          attributes: ['id'],
        });
        resolvedCategoryId = cat?.id ?? null;
      }

      if (isActive !== undefined) where.isActive = String(isActive) === 'true';
      if (resolvedCategoryId) where.categoryId = resolvedCategoryId;
      if (publisherId) where.publisherId = publisherId;
      if (departmentId) where.departmentId = departmentId;
      if (typeId) where.typeId = typeId;
      if (language) where.language = language;

      if (hasVideo === 'true') {
        where.videoUrl = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
      }
      if (hasAudio === 'true') {
        where.audioUrl = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
      }

      if (publicationYear) {
        where.publicationYear = publicationYear;
      } else if (yearFrom || yearTo) {
        where.publicationYear = {};
        if (yearFrom) where.publicationYear[Op.gte] = Number(yearFrom);
        if (yearTo) where.publicationYear[Op.lte] = Number(yearTo);
      }

      if (search) {
        const term = `%${search}%`;
        // Find book IDs whose authors match the search term
        const { BookAuthor } = require('../models');
        const matchingAuthors = await Author.findAll({
          where: { name: { [Op.iLike]: term } },
          attributes: ['id'],
          raw: true,
        });
        let authorBookIds = [];
        if (matchingAuthors.length) {
          const rows = await BookAuthor.findAll({
            where: { author_id: { [Op.in]: matchingAuthors.map(a => a.id) } },
            attributes: ['book_id'],
            raw: true,
          });
          authorBookIds = rows.map(r => r.book_id);
        }

        const yearNum = Number(search);
        where[Op.or] = [
          { title: { [Op.iLike]: term } },
          { titleKh: { [Op.iLike]: term } },
          { isbn: { [Op.iLike]: term } },
          ...(Number.isInteger(yearNum) && yearNum > 0 ? [{ publicationYear: yearNum }] : []),
          ...(authorBookIds.length ? [{ id: { [Op.in]: authorBookIds } }] : []),
        ];
      }

      // ── Author filter (requires a subquery to avoid JOIN count issues) ─
      if (authorId) {
        const { BookAuthor } = require('../models');
        const authorBookIds = (await BookAuthor.findAll({
          where: { author_id: authorId },
          attributes: ['book_id'],
          raw: true,
        })).map(r => r.book_id);
        where.id = { [Op.in]: authorBookIds };
      }

      // ── Sorting whitelist 
      const ALLOWED_SORTS = ['created_at', 'title', 'views', 'downloads', 'publication_year', 'updated_at'];
      const safeSort = ALLOWED_SORTS.includes(sortBy) ? sortBy : 'created_at';
      const safeOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // ── Query 1: total count (fast — no JOINs) 
      const total = await Book.count({ where });

      // ── Query 2: paginated books with full includes + ratings 
      const books = await Book.findAll({
        where,
        include: BOOK_INCLUDE,
        attributes: {
          include: [
            ...RATING_ATTRIBUTES,
            'videoUrl',
            'audioUrl'
          ]
        },
        order: [[safeSort, safeOrder]],
        limit: limitNum,
        offset,
        subQuery: true,
      });

      return ResponseFormatter.success(res, {
        books,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/books/:id 
  static async getById(req, res, next) {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id, isDeleted: false },
        include: BOOK_INCLUDE,
        attributes: {
          include: [
            ...RATING_ATTRIBUTES,
            'videoUrl',
            'audioUrl'
          ]
        },
      });
      if (!book) throw new NotFoundError('Book not found');

      // Fire-and-forget view increment — don't block response
      book.increment('views').catch(() => { });

      // Log view activity
      logActivity({
        userId: req.user?.id,
        action: 'view',
        targetId: book.id,
        targetName: book.title,
        targetType: 'book'
      }).catch(() => { });

      return ResponseFormatter.success(res, book);
    } catch (err) { next(err); }
  }

  // ── POST /api/books/scan-search
  static async scanSearch(req, res, next) {
    try {
      const file =
        req.files?.image?.[0] ??
        req.files?.file?.[0] ??
        req.files?.cover?.[0] ??
        null;

      if (!file) {
        throw new ValidationError('Image file is required for scan search');
      }

      const rawLimit = Number(req.body?.limit ?? req.query?.limit ?? 5);
      const safeLimit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 10) : 5;
      const rawScoreThreshold = req.body?.scoreThreshold ?? req.query?.scoreThreshold;
      const scoreThreshold =
        rawScoreThreshold === undefined || rawScoreThreshold === ''
          ? undefined
          : Number(rawScoreThreshold);

      const vectorResults = await scanBookCover(file, {
        limit: safeLimit,
        scoreThreshold: Number.isFinite(scoreThreshold) ? scoreThreshold : undefined,
      });

      const matches = Array.isArray(vectorResults.matches) ? vectorResults.matches : [];
      const matchedIds = matches.map((match) => Number(match.book_id)).filter((id) => !Number.isNaN(id));

      if (matchedIds.length === 0) {
        return ResponseFormatter.success(res, {
          matches: [],
          total: 0,
          source: 'vector-search',
        });
      }

      const books = await Book.findAll({
        where: {
          id: { [Op.in]: matchedIds },
          isDeleted: false,
          isActive: true,
        },
        include: BOOK_INCLUDE,
      });

      const bookMap = new Map(books.map((book) => [Number(book.id), book]));
      const orderedMatches = matches
        .map((match) => {
          const book = bookMap.get(Number(match.book_id));
          if (!book) return null;

          return {
            ...book.toJSON(),
            similarityScore: Number(match.score),
            scanPayload: match.payload ?? {},
          };
        })
        .filter(Boolean);

      return ResponseFormatter.success(res, {
        matches: orderedMatches,
        total: orderedMatches.length,
        source: 'vector-search',
      });
    } catch (err) { next(err); }
  }

  // ── POST /api/books
  static async create(req, res, next) {
    try {
      const {
        title, titleKh, isbn, publicationYear, description,
        pages,
        categoryId, publisherId, departmentId, typeId,
        authorIds = [],
        authorNames,
        editorNames,
        publisherNames,
        isActive = true,
      } = req.body;

      if (!title) throw new ValidationError('Title is required');
      await validateBookClassifications({ categoryId, departmentId, typeId });

      // Check ISBN uniqueness
      if (isbn) {
        const exists = await Book.findOne({ where: { isbn } });
        if (exists) throw new ConflictError(`ISBN '${isbn}' already exists`);
      }

      // authorIds may arrive as a JSON string when sent via FormData
      let parsedAuthorIds = authorIds;
      if (typeof authorIds === 'string') {
        try { parsedAuthorIds = JSON.parse(authorIds); } catch { parsedAuthorIds = []; }
      }

      // Files are pre-uploaded via POST /api/upload/single — accept URLs from body
      const coverUrl = req.body.coverUrl ?? null;
      const pdfUrl = req.body.pdfUrl ?? null;
      const videoUrl = req.body.videoUrl ?? null;
      const audioUrl = req.body.audioUrl ?? null;
      const book = await Book.create({
        title, titleKh, isbn, publicationYear, description,
        coverUrl, pdfUrl, videoUrl, audioUrl, pages,
        categoryId, publisherId, departmentId, typeId, isActive,
      });

      // Parse authorNames (find-or-create by name)
      let parsedAuthorNames = authorNames;
      if (typeof authorNames === 'string') {
        try { parsedAuthorNames = JSON.parse(authorNames); } catch { parsedAuthorNames = []; }
      }
      if (!Array.isArray(parsedAuthorNames)) parsedAuthorNames = [];

      // Attach authors — prefer authorNames (find-or-create) over legacy authorIds
      if (parsedAuthorNames.length > 0) {
        const authorRecords = await Promise.all(
          parsedAuthorNames
            .map((n, i) => ({ name: String(n ?? '').trim(), idx: i }))
            .filter(({ name }) => name)
            .map(async ({ name, idx }) => {
              const [author] = await Author.findOrCreate({ where: { name }, defaults: { name } });
              return { authorId: author.id, isPrimary: idx === 0 };
            })
        );
        if (authorRecords.length) {
          const { BookAuthor } = require('../models');
          await BookAuthor.bulkCreate(
            authorRecords.map(r => ({ book_id: book.id, author_id: r.authorId, is_primary_author: r.isPrimary }))
          );
        }
      } else if (parsedAuthorIds.length > 0) {
        const pairs = parsedAuthorIds.map((a) =>
          typeof a === 'object'
            ? { author_id: a.id, is_primary_author: a.isPrimaryAuthor ?? false }
            : { author_id: a, is_primary_author: false }
        );
        await Promise.all(pairs.map((p) =>
          book.addAuthor(p.author_id, { through: { isPrimaryAuthor: p.is_primary_author } })
        ));
      }

      // Attach editors — find-or-create by name
      let parsedEditorNames = editorNames;
      if (typeof editorNames === 'string') {
        try { parsedEditorNames = JSON.parse(editorNames); } catch { parsedEditorNames = []; }
      }
      if (!Array.isArray(parsedEditorNames)) parsedEditorNames = [];
      if (parsedEditorNames.length > 0) {
        const editorIds = await Promise.all(
          parsedEditorNames
            .map(r => String(r ?? '').trim())
            .filter(Boolean)
            .map(async (name) => {
              const [editor] = await Editor.findOrCreate({ where: { name }, defaults: { name } });
              return editor.id;
            })
        );
        if (editorIds.length) {
          const { BookEditor } = require('../models');
          await BookEditor.bulkCreate(editorIds.map(id => ({ book_id: book.id, editor_id: id })));
        }
      }

      // Attach publishers — find-or-create by name
      let parsedPublisherNames = publisherNames;
      if (typeof publisherNames === 'string') {
        try { parsedPublisherNames = JSON.parse(publisherNames); } catch { parsedPublisherNames = []; }
      }
      if (!Array.isArray(parsedPublisherNames)) parsedPublisherNames = [];
      let firstPublisherId = null;
      if (parsedPublisherNames.length > 0) {
        const pubIds = await Promise.all(
          parsedPublisherNames
            .map(r => String(r ?? '').trim())
            .filter(Boolean)
            .map(async (name) => {
              const [publisher] = await Publisher.findOrCreate({ where: { name }, defaults: { name } });
              return publisher.id;
            })
        );
        if (pubIds.length) {
          const { PublishersBooks } = require('../models');
          await PublishersBooks.bulkCreate(pubIds.map(id => ({ book_id: book.id, publisher_id: id })));
          firstPublisherId = pubIds[0];
        }
      }
      if (firstPublisherId) await book.update({ publisherId: firstPublisherId });

      const created = await Book.findOne({
        where: { id: book.id },
        include: BOOK_INCLUDE,
      });

      await syncBookCover(created);

      // Log activity
      logActivity({
        userId: req.user?.id,
        action: 'uploaded',
        targetId: book.id,
        targetName: book.title,
        targetType: 'book'
      });

      // Real-time: broadcast to admin + public (no duplication)
      emitBroadcast(EVENTS.BOOK_CREATED, { book: created });

      // Web Push: notify all subscribers of the new book
      broadcastNotification(
        '📚 New Book Added',
        `"${created.title}" is now available in the library.`,
        `/books/${created.id}`
      ).catch(() => { }); // fire-and-forget

      return ResponseFormatter.success(res, created, 'Book created successfully', 201);
    } catch (err) { next(err); }
  }

  // ── PUT /api/books/:id
  static async update(req, res, next) {
    try {
      const book = await Book.findOne({ where: { id: req.params.id, isDeleted: false } });
      if (!book) throw new NotFoundError('Book not found');

      const {
        title, titleKh, isbn, publicationYear, description,
        pages,
        categoryId, publisherId, departmentId, typeId,
        authorIds,   // legacy
        authorNames, // preferred: ["David", "Samnang"] — find-or-create by name
        editorNames, // ["Editor Name"] — find-or-create by name
        publisherNames, // ["Publisher Name"] — find-or-create by name
        isActive,
      } = req.body;

      // Check ISBN uniqueness (exclude self)
      if (isbn && isbn !== book.isbn) {
        const exists = await Book.findOne({ where: { isbn, id: { [Op.ne]: book.id } } });
        if (exists) throw new ConflictError(`ISBN '${isbn}' already exists`);
      }

      await validateBookClassifications(
        { categoryId, departmentId, typeId },
        { partial: true }
      );

      // authorIds may arrive as a JSON string when sent via FormData
      let parsedAuthorIds = authorIds;
      if (typeof authorIds === 'string') {
        try { parsedAuthorIds = JSON.parse(authorIds); } catch { parsedAuthorIds = undefined; }
      }

      // Files are pre-uploaded via POST /api/upload/single — accept URLs from body
      const coverUrl = req.body.coverUrl;
      const pdfUrl = req.body.pdfUrl;
      const videoUrl = req.body.videoUrl;
      const audioUrl = req.body.audioUrl;
      await book.update({
        ...(title !== undefined && { title }),
        ...(titleKh !== undefined && { titleKh }),
        ...(isbn !== undefined && { isbn }),
        ...(publicationYear !== undefined && { publicationYear }),
        ...(description !== undefined && { description }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(pdfUrl !== undefined && { pdfUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(audioUrl !== undefined && { audioUrl }),
        ...(pages !== undefined && { pages }),
        ...(categoryId !== undefined && { categoryId }),
        ...(publisherId !== undefined && { publisherId }),
        ...(departmentId !== undefined && { departmentId }),
        ...(typeId !== undefined && { typeId }),
        ...(isActive !== undefined && { isActive }),
      });

      // Parse authorNames for update
      let parsedAuthorNames = authorNames;
      if (typeof authorNames === 'string') {
        try { parsedAuthorNames = JSON.parse(authorNames); } catch { parsedAuthorNames = undefined; }
      }

      // Replace authors — prefer authorNames (find-or-create) over legacy authorIds
      if (Array.isArray(parsedAuthorNames)) {
        await book.setAuthors([]); // clear existing
        const authorRecords = await Promise.all(
          parsedAuthorNames
            .map((n, i) => ({ name: String(n ?? '').trim(), idx: i }))
            .filter(({ name }) => name)
            .map(async ({ name, idx }) => {
              const [author] = await Author.findOrCreate({ where: { name }, defaults: { name } });
              return { authorId: author.id, isPrimary: idx === 0 };
            })
        );
        if (authorRecords.length) {
          const { BookAuthor } = require('../models');
          await BookAuthor.bulkCreate(
            authorRecords.map(r => ({ book_id: book.id, author_id: r.authorId, is_primary_author: r.isPrimary }))
          );
        }
      } else if (parsedAuthorIds !== undefined) {
        // Legacy authorIds path
        await book.setAuthors([]); // clear
        if (parsedAuthorIds.length > 0) {
          await Promise.all(parsedAuthorIds.map((a) => {
            const id = typeof a === 'object' ? a.id : a;
            const isPrimary = typeof a === 'object' ? (a.isPrimaryAuthor ?? false) : false;
            return book.addAuthor(id, { through: { isPrimaryAuthor: isPrimary } });
          }));
        }
      }

      // Replace editors — find-or-create by name
      let parsedEditorNames = editorNames;
      if (typeof editorNames === 'string') {
        try { parsedEditorNames = JSON.parse(editorNames); } catch { parsedEditorNames = undefined; }
      }
      if (Array.isArray(parsedEditorNames)) {
        await book.setEditors([]); // clear existing
        const editorIds = await Promise.all(
          parsedEditorNames
            .map(r => String(r ?? '').trim())
            .filter(Boolean)
            .map(async (name) => {
              const [editor] = await Editor.findOrCreate({ where: { name }, defaults: { name } });
              return editor.id;
            })
        );
        if (editorIds.length) {
          const { BookEditor } = require('../models');
          await BookEditor.bulkCreate(editorIds.map(id => ({ book_id: book.id, editor_id: id })));
        }
      }

      // Replace publishers — find-or-create by name
      let parsedPublisherNames = publisherNames;
      if (typeof publisherNames === 'string') {
        try { parsedPublisherNames = JSON.parse(publisherNames); } catch { parsedPublisherNames = undefined; }
      }
      if (Array.isArray(parsedPublisherNames)) {
        await book.setPublishers([]);
        let firstPublisherId = null;
        const pubIds = await Promise.all(
          parsedPublisherNames
            .map(r => String(r ?? '').trim())
            .filter(Boolean)
            .map(async (name) => {
              const [publisher] = await Publisher.findOrCreate({ where: { name }, defaults: { name } });
              return publisher.id;
            })
        );
        if (pubIds.length) {
          const { PublishersBooks } = require('../models');
          await PublishersBooks.bulkCreate(pubIds.map(id => ({ book_id: book.id, publisher_id: id })));
          firstPublisherId = pubIds[0];
        }
        if (firstPublisherId) await book.update({ publisherId: firstPublisherId });
      }

      const updated = await Book.findOne({ where: { id: book.id }, include: BOOK_INCLUDE });
      await syncBookCover(updated);
      // Log activity
      logActivity({
        userId: req.user?.id,
        action: 'updated',
        targetId: book.id,
        targetName: book.title,
        targetType: 'book'
      });

      // Real-time: broadcast to admin + public (no duplication)
      emitBroadcast(EVENTS.BOOK_UPDATED, { book: updated });

      return ResponseFormatter.success(res, updated, 'Book updated successfully');
    } catch (err) { next(err); }
  }

  // ── DELETE /api/books/:id (soft delete) 
  static async delete(req, res, next) {
    try {
      const book = await Book.findOne({ where: { id: req.params.id, isDeleted: false } });
      if (!book) throw new NotFoundError('Book not found');
      try {
        await deleteBookCover(book.id);
      } catch {
        // Deleting the vector should not block the primary record deletion.
      }
      await book.update({ isDeleted: true, isActive: false });

      // Log activity
      logActivity({
        userId: req.user?.id,
        action: 'deleted',
        targetId: book.id,
        targetName: book.title,
        targetType: 'book'
      });

      // Real-time: broadcast to admin + public (no duplication)
      emitBroadcast(EVENTS.BOOK_DELETED, { bookId: book.id });

      return ResponseFormatter.noContent(res, null, 'Book deleted successfully');
    } catch (err) { next(err); }
  }

  // ── GET /api/books/:id/downloads
  static async getDownloads(req, res, next) {
    try {
      const book = await Book.findOne({ where: { id: req.params.id, isDeleted: false } });
      if (!book) throw new NotFoundError('Book not found');

      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Download.findAndCountAll({
        where: { bookId: book.id },
        include: [{ model: User, as: 'User', attributes: ['id', 'username', 'firstName', 'lastName', 'email'] }],
        order: [['downloadedAt', 'DESC']],
        limit: Number(limit),
        offset,
      });

      return ResponseFormatter.success(res, {
        downloads: rows, total: count,
        page: Number(page), totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (err) { next(err); }
  }

  // ── GET /api/books/:id/summary  (AI-generated, Gemini, cached 24 h)
  static async getSummary(req, res, next) {
    try {
      const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      if (!BookController._sumCache) BookController._sumCache = new Map();
      const key = `sum_${req.params.id}`;
      const cached = BookController._sumCache.get(key);
      if (cached && Date.now() - cached.ts < 24 * 60 * 60 * 1000) {
        return ResponseFormatter.success(res, { summary: cached.text }, 'Book summary (cached)');
      }
      const book = await Book.findOne({
        where: { id: req.params.id, isDeleted: false },
        include: [
          { model: Author, as: 'Authors', attributes: ['name'] },
          { model: Category, as: 'Category', attributes: ['name'] },
        ],
        attributes: ['id', 'title', 'description', 'publicationYear'],
      });
      if (!book) throw new NotFoundError('Book not found');

      const authorsStr = (book.Authors || []).map((a) => a.name).join(', ') || 'Unknown';
      const prompt = `Write a concise 3-sentence academic summary for this library book.
Title: ${book.title}
Author(s): ${authorsStr}
Category: ${book.Category?.name || 'General'}
Description: ${book.description || '(no description)'}
Requirements: exactly 3 sentences, academic tone, no first person, mention the key topic and who benefits from reading it.`;

      const r = await fetch(`${GEMINI_URL}?key=${process.env.GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
        }),
      });
      const data = await r.json();
      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        || book.description?.slice(0, 400)
        || 'No summary available.';

      BookController._sumCache.set(key, { text: summary, ts: Date.now() });
      return ResponseFormatter.success(res, { summary }, 'Book summary generated');
    } catch (err) { next(err); }
  }

  // ── POST /api/books/:id/share
  static async incrementShare(req, res, next) {
    try {
      const book = await Book.findOne({ where: { id: req.params.id, isDeleted: false } });
      if (!book) throw new NotFoundError('Book not found');

      await book.increment('shares');

      const updatedBook = await Book.findOne({
        where: { id: book.id },
        attributes: ['id', 'shares'],
      });

      return ResponseFormatter.success(res, { shares: updatedBook?.shares ?? 0 }, 'Share count incremented successfully');
    } catch (err) { next(err); }
  }
}

module.exports = BookController;
