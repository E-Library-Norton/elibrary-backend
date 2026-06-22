// routes/feedback.js
const router = require('express').Router();
const FeedbackController = require('../controllers/feedbackController');
const { authenticate, requirePermission, optionalAuth } = require('../middleware/auth');

//  Public — submit feedback (optionalAuth: logged-in users auto-link) 
router.post('/', optionalAuth, FeedbackController.create);

//  Public — testimonials for homepage 
router.get('/public', FeedbackController.getPublicTestimonials);

//  Admin — list all feedback with filters 
router.get('/', authenticate, requirePermission('users.view'), FeedbackController.getAll);

//  Admin — feedback stats 
router.get('/stats', authenticate, requirePermission('users.view'), FeedbackController.getStats);

//  Admin — single feedback detail 
router.get('/:id', authenticate, requirePermission('users.view'), FeedbackController.getById);

//  Admin — update status / add notes ─
router.patch('/:id', authenticate, requirePermission('users.update'), FeedbackController.update);

//  Admin — delete feedback ─
router.delete('/:id', authenticate, requirePermission('users.delete'), FeedbackController.delete);

module.exports = router;
