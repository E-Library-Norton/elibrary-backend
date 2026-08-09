const ReadingService = require("../services/readingService");
const ReadingSummaryService = require("../services/readingSummaryService");
const ResponseFormatter = require("../utils/responseFormatter");

class ReadingController {
  static async getProgress(req, res, next) {
    try {
      const progress = await ReadingService.getProgress(
        req.user.id,
        req.params.bookId
      );
      return ResponseFormatter.success(
        res,
        progress,
        "Reading progress retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateProgress(req, res, next) {
    try {
      const progress = await ReadingService.updateProgress(
        req.user.id,
        req.params.bookId,
        req.body
      );
      return ResponseFormatter.success(
        res,
        progress,
        "Reading progress updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  static async listBookmarks(req, res, next) {
    try {
      const bookmarks = await ReadingService.listBookmarks(
        req.user.id,
        req.params.bookId
      );
      return ResponseFormatter.success(
        res,
        bookmarks,
        "Bookmarks retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  static async createBookmark(req, res, next) {
    try {
      const bookmark = await ReadingService.createBookmark(
        req.user.id,
        req.params.bookId,
        req.body
      );
      return ResponseFormatter.success(
        res,
        bookmark,
        "Page bookmarked successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteBookmark(req, res, next) {
    try {
      await ReadingService.deleteBookmark(
        req.user.id,
        req.params.bookId,
        req.params.bookmarkId
      );
      return ResponseFormatter.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async listNotes(req, res, next) {
    try {
      const notes = await ReadingService.listNotes(
        req.user.id,
        req.params.bookId
      );
      return ResponseFormatter.success(
        res,
        notes,
        "Reading notes retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  static async createNote(req, res, next) {
    try {
      const note = await ReadingService.createNote(
        req.user.id,
        req.params.bookId,
        req.body
      );
      return ResponseFormatter.success(
        res,
        note,
        "Reading note saved successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateNote(req, res, next) {
    try {
      const note = await ReadingService.updateNote(
        req.user.id,
        req.params.bookId,
        req.params.noteId,
        req.body
      );
      return ResponseFormatter.success(
        res,
        note,
        "Reading note updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteNote(req, res, next) {
    try {
      await ReadingService.deleteNote(
        req.user.id,
        req.params.bookId,
        req.params.noteId
      );
      return ResponseFormatter.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async summarizeNotes(req, res, next) {
    try {
      const summary = await ReadingSummaryService.summarize(
        req.user.id,
        req.params.bookId
      );
      return ResponseFormatter.success(
        res,
        summary,
        "Reading notes summarized successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  static async getLibrary(req, res, next) {
    try {
      const items = await ReadingService.getLibrary(req.user.id);
      return ResponseFormatter.success(
        res,
        { items },
        "Reading library retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReadingController;
