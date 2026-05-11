const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activityController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get(
    '/',
    authenticate,
    requirePermission('users.view'),
    ActivityController.getActivities
);

module.exports = router;
