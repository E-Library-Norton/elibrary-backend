const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activityController');
const { authenticate, authorize } = require('../middleware/auth');

router.get(
    '/',
    authenticate,
    authorize('admin'),
    ActivityController.getActivities
);

module.exports = router;
