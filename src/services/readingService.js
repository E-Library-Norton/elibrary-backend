const { fn, col } = require("sequelize");
const {
  sequelize,
  Book,
  Category,
  Author,
  Publisher,
  ReadingProgress,
  Bookmark,
  ReadingNote,
} = require("../models");
const {
  ConflictError,
  NotFoundError,
  ValidationError,
} = require("../utils/errors");

const HIGHLIGHT_COLORS = new Set([
  "yellow",
  "green",
  "blue",
  "pink",
  "purple",
]);

function normalizeOptionalText(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function calculateProgress(currentPage, totalPages) {
  return Number(Math.min(100, (currentPage / totalPages) * 100).toFixed(2));
}

async function ensureReadableBook(bookId, transaction) {
  const book = await Book.findOne({
    where: { id: bookId, isDeleted: false, isActive: true },
    transaction,
  });

  if (!book) {
    throw new NotFoundError("Book not found");
  }

  return book;
}

async function validatePageForUser(
  userId,
  bookId,
  pageNumber,
  knownBookPages,
  transaction
) {
  const progress = await ReadingProgress.findOne({
    where: { userId, bookId },
    attributes: ["totalPages"],
    transaction,
  });
  const maximumPage = progress?.totalPages || knownBookPages;

  if (maximumPage && pageNumber > maximumPage) {
    throw new ValidationError(
      `Page number must be between 1 and ${maximumPage}`
    );
  }
}

class ReadingService {
  static async getProgress(userId, bookId) {
    await ensureReadableBook(bookId);
    return ReadingProgress.findOne({ where: { userId, bookId } });
  }

  static async updateProgress(userId, bookId, values) {
    const { currentPage, totalPages } = values;

    if (currentPage > totalPages) {
      throw new ValidationError("Current page cannot exceed total pages");
    }

    return sequelize.transaction(async (transaction) => {
      await ensureReadableBook(bookId, transaction);
      const now = new Date();
      const progressPercentage = calculateProgress(currentPage, totalPages);

      let progress = await ReadingProgress.findOne({
        where: { userId, bookId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const completedAt =
        progressPercentage === 100
          ? progress?.completedAt || now
          : progress?.completedAt || null;

      if (progress) {
        await progress.update(
          {
            currentPage,
            totalPages,
            progressPercentage,
            lastReadAt: now,
            completedAt,
          },
          { transaction }
        );
      } else {
        progress = await ReadingProgress.create(
          {
            userId,
            bookId,
            currentPage,
            totalPages,
            progressPercentage,
            lastReadAt: now,
            completedAt,
          },
          { transaction }
        );
      }

      return progress;
    });
  }

  static async listBookmarks(userId, bookId) {
    await ensureReadableBook(bookId);
    return Bookmark.findAll({
      where: { userId, bookId },
      order: [
        ["pageNumber", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  }

  static async createBookmark(userId, bookId, values) {
    const { pageNumber } = values;
    const book = await ensureReadableBook(bookId);
    await validatePageForUser(userId, bookId, pageNumber, book.pages);

    const existing = await Bookmark.findOne({
      where: { userId, bookId, pageNumber },
    });
    if (existing) {
      throw new ConflictError("This page is already bookmarked");
    }

    try {
      return await Bookmark.create({
        userId,
        bookId,
        pageNumber,
        title: normalizeOptionalText(values.title),
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new ConflictError("This page is already bookmarked");
      }
      throw error;
    }
  }

  static async deleteBookmark(userId, bookId, bookmarkId) {
    await ensureReadableBook(bookId);
    const bookmark = await Bookmark.findOne({
      where: { id: bookmarkId, userId, bookId },
    });
    if (!bookmark) {
      throw new NotFoundError("Bookmark not found");
    }

    await bookmark.destroy();
  }

  static async listNotes(userId, bookId) {
    await ensureReadableBook(bookId);
    return ReadingNote.findAll({
      where: { userId, bookId },
      order: [
        ["pageNumber", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  }

  static async createNote(userId, bookId, values) {
    const { pageNumber } = values;
    const book = await ensureReadableBook(bookId);
    await validatePageForUser(userId, bookId, pageNumber, book.pages);

    return ReadingNote.create({
      userId,
      bookId,
      pageNumber,
      selectedText: values.selectedText.trim(),
      noteText: normalizeOptionalText(values.noteText),
      highlightColor: values.highlightColor || "yellow",
    });
  }

  static async updateNote(userId, bookId, noteId, values) {
    await ensureReadableBook(bookId);
    const note = await ReadingNote.findOne({
      where: { id: noteId, userId, bookId },
    });
    if (!note) {
      throw new NotFoundError("Reading note not found");
    }

    const updates = {};
    if (values.noteText !== undefined) {
      updates.noteText = normalizeOptionalText(values.noteText);
    }
    if (values.highlightColor !== undefined) {
      if (!HIGHLIGHT_COLORS.has(values.highlightColor)) {
        throw new ValidationError("Invalid highlight color");
      }
      updates.highlightColor = values.highlightColor;
    }

    return note.update(updates);
  }

  static async deleteNote(userId, bookId, noteId) {
    await ensureReadableBook(bookId);
    const note = await ReadingNote.findOne({
      where: { id: noteId, userId, bookId },
    });
    if (!note) {
      throw new NotFoundError("Reading note not found");
    }

    await note.destroy();
  }

  static async getLibrary(userId) {
    const [progressRows, bookmarkCounts, noteCounts] = await Promise.all([
      ReadingProgress.findAll({
        where: { userId },
        include: [
          {
            model: Book,
            as: "Book",
            required: true,
            where: { isDeleted: false, isActive: true },
            attributes: [
              "id",
              "title",
              "titleKh",
              "coverUrl",
              "pages",
              "categoryId",
              "publicationYear",
              "publisherId",
              "isbn",
            ],
            include: [
              {
                model: Category,
                as: "Category",
                required: false,
                attributes: ["id", "name"],
              },
              {
                model: Author,
                as: "Authors",
                required: false,
                attributes: ["id", "name"],
                through: { attributes: [] },
              },
              {
                model: Publisher,
                as: "Publisher",
                required: false,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
        order: [["lastReadAt", "DESC"]],
      }),
      Bookmark.findAll({
        where: { userId },
        attributes: ["bookId", [fn("COUNT", col("id")), "count"]],
        group: ["bookId"],
        raw: true,
      }),
      ReadingNote.findAll({
        where: { userId },
        attributes: ["bookId", [fn("COUNT", col("id")), "count"]],
        group: ["bookId"],
        raw: true,
      }),
    ]);

    const toCountMap = (rows) =>
      new Map(rows.map((row) => [String(row.bookId), Number(row.count)]));
    const bookmarksByBook = toCountMap(bookmarkCounts);
    const notesByBook = toCountMap(noteCounts);

    return progressRows.map((row) => {
      const progress = row.toJSON();
      const bookId = String(progress.bookId);

      return {
        ...progress,
        bookmarkCount: bookmarksByBook.get(bookId) || 0,
        noteCount: notesByBook.get(bookId) || 0,
      };
    });
  }
}

module.exports = ReadingService;
