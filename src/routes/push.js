// routes/push.js
const router = require('express').Router();
const PushController = require('../controllers/pushController');
const { authenticate } = require('../middleware/auth');

// ── GET  /api/push/vapid-public-key  — public (browser needs this before subscribing)
router.get('/vapid-public-key', PushController.getVapidPublicKey);

// ── POST /api/push/subscribe  — optionally authenticated
router.post('/subscribe', authenticate, PushController.subscribe);

// ── DELETE /api/push/unsubscribe  — optionally authenticated
router.delete('/unsubscribe', authenticate, PushController.unsubscribe);

module.exports = router;
