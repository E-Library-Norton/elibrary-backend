const ResponseFormatter = require('../utils/responseFormatter');
const { getReport } = require('../services/reportService');
const { exportReport, MAX_EXPORT_ROWS } = require('../services/reportExportService');
const { logActivity } = require('../utils/activityLogger');

function actorName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.email;
}

class ReportController {
  static async get(req, res, next) {
    try {
      const data = await getReport(req.params.type, req.reportFilters || req.query);
      return ResponseFormatter.success(res, data, `${req.params.type} report retrieved successfully`);
    } catch (error) {
      next(error);
    }
  }

  static async export(req, res, next) {
    try {
      const filters = { ...(req.reportFilters || {}), page: 1, limit: MAX_EXPORT_ROWS, exportAll: true };
      const data = await getReport(req.params.type, filters);
      const file = await exportReport({
        type: req.params.type,
        format: req.params.format,
        data,
        generatedBy: actorName(req.user),
      });
      await logActivity({
        userId: req.user.id,
        action: 'REPORT_EXPORTED',
        targetType: 'report',
        targetName: req.params.type,
        metadata: { format: req.params.format, filters: data.filters, totalRecords: data.pagination.totalItems },
      });
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Length', file.buffer.length);
      return res.send(file.buffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportController;
