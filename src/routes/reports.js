const express = require('express');
const rateLimit = require('express-rate-limit');
const ReportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { requireReportAccess, requireReportExport } = require('../middleware/reportAuthorization');
const { validateReportRequest } = require('../middleware/reportValidation');

const router = express.Router();
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'REPORT_EXPORT_LIMIT', message: 'Too many report exports. Please try again later.' } },
});

router.use(authenticate);
router.post('/:type/export/:format', exportLimiter, validateReportRequest, requireReportAccess, requireReportExport, ReportController.export);
router.get('/:type', validateReportRequest, requireReportAccess, ReportController.get);

module.exports = router;
