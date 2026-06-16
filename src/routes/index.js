// src/routes/index.js
const express = require('express');
const router = express.Router();

// Auth routes
const authRoutes = require('./auth');

// ── RBAC routes 
const userRoutes = require('./users');
const roleRoutes = require('./roles');
const permissionRoutes = require('./permissions');

// ── Library / Book routes 
const uploadRoute = require('./uploads');
const bookRoutes = require('./books');
const categoriesRoutes = require('./categories');
const authorRoutes = require('./authors');
const editorRoutes = require('./editors');
const publisherRoutes = require('./publishers');
const materialTypeRoutes = require('./materialTypes');
const departmentRoutes = require('./departments');
const downloadRoutes = require('./downloads');
const statsRoutes = require('./stats');
const settingsRoutes = require('./settings');
const activityLogRoutes = require('./activities');
const reviewRoutes = require('./reviews');
const pushRoutes = require('./push');
const feedbackRoutes = require('./feedback');
const aiRecommendationRoutes = require('./aiRecommendations');
// ── Mount 

// Auth
router.use('/auth', authRoutes);

// RBAC
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);


// Library
router.use('/uploads', uploadRoute)
router.use('/books', bookRoutes);
router.use('/categories', categoriesRoutes);
router.use('/authors', authorRoutes);
router.use('/editors', editorRoutes);
router.use('/publishers', publisherRoutes);
router.use('/material-types', materialTypeRoutes);
router.use('/departments', departmentRoutes);
router.use('/downloads', downloadRoutes);
router.use('/stats', statsRoutes);
router.use('/settings', settingsRoutes);
router.use('/activities', activityLogRoutes);
router.use('/reviews', reviewRoutes);
router.use('/push', pushRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/ai/recommendations', aiRecommendationRoutes);

// ── API info 
router.get('/', (req, res) => {
  res.json({
    name: 'E-Library API',
    version: '1.0.0',
    description: 'Backend API for E-Library NU',
  });
});

module.exports = router;
