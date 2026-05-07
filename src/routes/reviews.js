// routes/reviews.js
const router           = require('express').Router();
const ReviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');

// ── Public — homepage testimonials (no auth) ────────────────────────────────
// GET /api/reviews/public?limit=50
router.get('/public', ReviewController.getPublic);

// ── Admin — list all reviews with filters ────────────────────────────────────
// GET /api/reviews?page=1&limit=20&bookId=&userId=&rating=
router.get('/', authenticate, authorize('admin', 'librarian'), ReviewController.getAll);

// ── Admin stats ───────────────────────────────────────────────────────────────
router.get('/stats', authenticate, authorize('admin', 'librarian'), ReviewController.getStats);

// ── Authenticated user's own reviews ─────────────────────────────────────────
router.get('/my', authenticate, ReviewController.getMyReviews);

// ── Owner or admin ───────────────────────────────────────────────────────────
router.put('/:id', authenticate, ReviewController.update);
router.delete('/:id', authenticate, ReviewController.delete);

// ── Export nested handler for books router ────────────────────────────────────
// Mounted inside books.js as /api/books/:bookId/reviews
ReviewController.getByBook = ReviewController.getByBook;

module.exports = router;
module.exports.ReviewController = ReviewController;
