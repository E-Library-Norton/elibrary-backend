const ResponseFormatter = require('../utils/responseFormatter');

const TYPE_PERMISSIONS = {
  overview: 'reports.view',
  users: 'reports.users.view',
  logins: 'reports.logins.view',
  books: 'reports.books.view',
  'book-views': 'reports.books.view',
  downloads: 'reports.downloads.view',
  'reading-progress': 'reports.reading.view',
  reviews: 'reports.reviews.view',
  feedback: 'reports.feedback.view',
  authors: 'reports.books.view',
  categories: 'reports.books.view',
  departments: 'reports.books.view',
  activities: 'reports.activities.view',
};

function accessContext(user) {
  const roles = new Set((user?.Roles || []).map((role) => role.name.toLowerCase().trim()));
  const permissions = new Set([
    ...(user?.Permissions || []).map((permission) => permission.name),
    ...(user?.Roles || []).flatMap((role) => (role.Permissions || []).map((permission) => permission.name)),
  ]);
  return { isAdmin: roles.has('admin'), permissions };
}

function requireReportAccess(req, res, next) {
  const { isAdmin, permissions } = accessContext(req.user);
  const required = TYPE_PERMISSIONS[req.params.type];
  if (isAdmin || (permissions.has('reports.view') && permissions.has(required))) return next();
  return ResponseFormatter.forbidden(res, `Permission required: ${required || 'reports.view'}`);
}

function requireReportExport(req, res, next) {
  const { isAdmin, permissions } = accessContext(req.user);
  const required = req.params.format === 'pdf' ? 'reports.export.pdf' : 'reports.export.excel';
  if (isAdmin || permissions.has(required)) return next();
  return ResponseFormatter.forbidden(res, `Permission required: ${required}`);
}

module.exports = { TYPE_PERMISSIONS, requireReportAccess, requireReportExport };
