// routes/aiRecommendations.js
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const AIRecommendationController = require('../controllers/aiRecommendationController');
const { authenticate } = require('../middleware/auth');

// ── Rate limiter: 20 AI requests per minute per IP 
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests — please wait a moment before trying again',
  },
});

// Apply rate limit to ALL routes in this file
router.use(aiLimiter);

router.get('/', (req, res, next) => {
  const { category, bookTitle, userId } = req.query;

  if (category) return AIRecommendationController.byCategory(req, res, next);
  if (bookTitle) return AIRecommendationController.byBook(req, res, next);
  if (userId) return authenticate(req, res, () => AIRecommendationController.byUserHistory(req, res, next));

  return res.status(400).json({
    success: false,
    message: 'Provide one of: category, bookTitle, or userId=current',
    examples: [
      'GET /api/ai/recommendations?category=Programming',
      'GET /api/ai/recommendations?bookTitle=Clean+Code',
      'GET /api/ai/recommendations?userId=current  (requires Authorization header)',
    ],
  });
});

/**
 * GET /api/ai/recommendations/trending
 *
 * Returns the most-downloaded and most-viewed books this month
 * with AI-generated trend summaries.
 *
 * Optional query:
 *   ?limit=6   (max 20)
 */
router.get('/trending', AIRecommendationController.trending);

/**
 * GET /api/ai/recommendations/similar/:bookId
 *
 * Returns similar book recommendations based on a specific book DB id.
 */
router.get('/similar/:bookId', AIRecommendationController.similarById);

/**
 * POST /api/ai/recommendations/personalized
 *
 * Body (all optional, at least one required):
 * {
 *   readingHistory: [{ title: "...", author: "..." }],
 *   categoryIds:    [1, 3],
 *   bookId:         42
 * }
 */
router.post('/personalized', AIRecommendationController.personalized);

/**
 * POST /api/ai/recommendations/chat
 *
 * Body:
 * {
 *   message: "What are some good books about machine learning?",
 *   context?: {
 *     currentBook?:     "Clean Code",
 *     currentCategory?: "Programming"
 *   }
 * }
 *
 * Conversational AI librarian assistant.
 */
router.post('/chat', AIRecommendationController.chat);

module.exports = router;