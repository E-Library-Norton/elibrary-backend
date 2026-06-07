// routes/books.js
const router             = require('express').Router();
const BookController     = require('../controllers/bookController');
const DownloadController = require('../controllers/downloadController');
const ReviewController   = require('../controllers/reviewController');
const { authenticate, authorize, requirePermission, authenticateStream } = require('../middleware/auth');
const { uploadMulti, uploadScan }    = require('../middleware/upload');

// Public — anyone can browse
router.get ('/',           BookController.getAll);
router.post('/scan-search', uploadScan, BookController.scanSearch);
router.get ('/:id',        BookController.getById);
router.get ('/:id/summary', BookController.getSummary); // AI summary (Gemini, cached 24 h)
router.post('/:id/share',   BookController.incrementShare);


router.get('/:id/cover',    DownloadController.getCover);                            
router.get('/:id/pdf-url',  authenticate,        DownloadController.getPdfUrl);      
router.get('/:id/video-url', authenticate,       DownloadController.getVideoUrl);   
router.get('/:id/audio-url', authenticate,       DownloadController.getAudioUrl);    
router.get('/:id/stream',   DownloadController.streamPdf);                        
router.get('/:id/download', authenticateStream,  DownloadController.recordDownload); 

// Admin stats for a book
router.get('/:id/downloads', authenticate, requirePermission('books.view'), BookController.getDownloads);


router.post  ('/',     authenticate, requirePermission('books.create'), uploadMulti, BookController.create);
router.put   ('/:id',  authenticate, requirePermission('books.update'), uploadMulti, BookController.update);
router.delete('/:id',  authenticate, requirePermission('books.delete'),              BookController.delete);


router.get ('/:bookId/reviews', ReviewController.getByBook);
router.post('/:bookId/reviews', authenticate, ReviewController.create);

module.exports = router;
