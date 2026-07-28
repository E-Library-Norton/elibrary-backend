// routes/books.js
const router = require('express').Router();
const BookController = require('../controllers/bookController');
const DownloadController = require('../controllers/downloadController');
const ReviewController = require('../controllers/reviewController');
const ReadingController = require('../controllers/readingController');
const { authenticate, authorize, requirePermission, authenticateStream } = require('../middleware/auth');
const { uploadMulti, uploadScan } = require('../middleware/upload');
const readingRules = require('../middleware/readingValidation');

// Public — anyone can browse
router.get('/', BookController.getAll);
router.post('/scan-search', uploadScan, BookController.scanSearch);
router.get('/:id', BookController.getById);
router.get('/:id/summary', BookController.getSummary); // AI summary (Gemini, cached 24 h)
router.post('/:id/share', BookController.incrementShare);


router.get('/:id/cover', DownloadController.getCover);
router.get('/:id/pdf-url', authenticate, DownloadController.getPdfUrl);
router.get('/:id/video-url', authenticate, DownloadController.getVideoUrl);
router.get('/:id/audio-url', authenticate, DownloadController.getAudioUrl);
router.get('/:id/stream', DownloadController.streamPdf);
router.get('/:id/download', authenticateStream, DownloadController.recordDownload);

// Admin stats for a book
router.get('/:id/downloads', authenticate, requirePermission('books.view'), BookController.getDownloads);

// Personal reading data — always scoped to the authenticated user.
router.get(
  '/:bookId/reading-progress',
  authenticate,
  readingRules.book,
  ReadingController.getProgress
);
router.put(
  '/:bookId/reading-progress',
  authenticate,
  readingRules.updateProgress,
  ReadingController.updateProgress
);
router.get(
  '/:bookId/bookmarks',
  authenticate,
  readingRules.book,
  ReadingController.listBookmarks
);
router.post(
  '/:bookId/bookmarks',
  authenticate,
  readingRules.createBookmark,
  ReadingController.createBookmark
);
router.delete(
  '/:bookId/bookmarks/:bookmarkId',
  authenticate,
  readingRules.deleteBookmark,
  ReadingController.deleteBookmark
);
router.get(
  '/:bookId/notes',
  authenticate,
  readingRules.book,
  ReadingController.listNotes
);
router.post(
  '/:bookId/notes',
  authenticate,
  readingRules.createNote,
  ReadingController.createNote
);
router.patch(
  '/:bookId/notes/:noteId',
  authenticate,
  readingRules.updateNote,
  ReadingController.updateNote
);
router.delete(
  '/:bookId/notes/:noteId',
  authenticate,
  readingRules.deleteNote,
  ReadingController.deleteNote
);


router.post('/', authenticate, requirePermission('books.create'), uploadMulti, BookController.create);
router.put('/:id', authenticate, requirePermission('books.update'), uploadMulti, BookController.update);
router.delete('/:id', authenticate, requirePermission('books.delete'), BookController.delete);


router.get('/:bookId/reviews', ReviewController.getByBook);
router.post('/:bookId/reviews', authenticate, ReviewController.create);

module.exports = router;
