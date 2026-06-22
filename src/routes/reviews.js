// routes/reviews.js
const router = require('express').Router();
const ReviewController = require('../controllers/reviewController');
const { authenticate, requirePermission } = require('../middleware/auth');

// ── Public — homepage testimonials (no auth) 
router.get('/public', ReviewController.getPublic);

// ── Admin — list all reviews with filters 
router.get('/', authenticate, requirePermission('books.view'), ReviewController.getAll);

// ── Admin stats 
router.get('/stats', authenticate, requirePermission('books.view'), ReviewController.getStats);

// ── Authenticated user's own reviews ─
router.get('/my', authenticate, ReviewController.getMyReviews);

// ── Owner or admin 
router.put('/:id', authenticate, ReviewController.update);
router.delete('/:id', authenticate, ReviewController.delete);

// ── Export nested handler for books router 
// Mounted inside books.js as /api/books/:bookId/reviews
ReviewController.getByBook = ReviewController.getByBook;

module.exports = router;
module.exports.ReviewController = ReviewController;
