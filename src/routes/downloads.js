// routes/downloads.js
const router               = require('express').Router();
const DownloadController   = require('../controllers/downloadController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/my',    authenticate,                                          DownloadController.getMyDownloads);
router.get('/stats', authenticate, requirePermission('books.view'),         DownloadController.getStats);
router.get('/',      authenticate, requirePermission('books.view'),         DownloadController.getAll);

module.exports = router;