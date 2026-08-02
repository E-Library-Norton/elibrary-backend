const ResponseFormatter = require('../utils/responseFormatter');

const REPORT_TYPES = new Set([
  'overview',
  'users',
  'logins',
  'books',
  'book-views',
  'downloads',
  'reading-progress',
  'reviews',
  'feedback',
  'authors',
  'categories',
  'departments',
  'activities',
]);

const PERIODS = new Set([
  'today',
  'yesterday',
  'last_7_days',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'this_year',
  'last_year',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom',
]);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function requestFilters(req) {
  if (req.method === 'GET') return req.query;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const filters = body.filters && typeof body.filters === 'object' ? body.filters : {};
  return { ...filters, ...body, filters: undefined };
}

function validateReportRequest(req, res, next) {
  const errors = [];
  const filters = requestFilters(req);
  const { type, format } = req.params;

  if (!REPORT_TYPES.has(type)) errors.push({ path: 'type', msg: 'Unsupported report type' });
  if (format && !['pdf', 'excel'].includes(format)) {
    errors.push({ path: 'format', msg: 'Export format must be pdf or excel' });
  }

  const page = Number(filters.page ?? 1);
  const limit = Number(filters.limit ?? 20);
  if (!Number.isInteger(page) || page < 1) errors.push({ path: 'page', msg: 'Page must be a positive integer' });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    errors.push({ path: 'limit', msg: 'Limit must be between 1 and 100' });
  }

  const period = filters.period ?? 'this_month';
  if (!PERIODS.has(period)) errors.push({ path: 'period', msg: 'Unsupported report period' });

  for (const field of ['startDate', 'endDate']) {
    if (filters[field] && !isValidDate(filters[field])) {
      errors.push({ path: field, msg: `${field} must use YYYY-MM-DD format` });
    }
  }
  if (period === 'custom' && (!filters.startDate || !filters.endDate)) {
    errors.push({ path: 'dateRange', msg: 'Custom reports require startDate and endDate' });
  }
  if (filters.startDate && filters.endDate) {
    const start = new Date(`${filters.startDate}T00:00:00Z`);
    const end = new Date(`${filters.endDate}T00:00:00Z`);
    const days = (end - start) / 86_400_000;
    if (!Number.isFinite(days) || days < 0) errors.push({ path: 'dateRange', msg: 'endDate must be on or after startDate' });
    if (days > 366) errors.push({ path: 'dateRange', msg: 'Date range cannot exceed 366 days' });
  }

  if (filters.sortOrder && !['ASC', 'DESC', 'asc', 'desc'].includes(filters.sortOrder)) {
    errors.push({ path: 'sortOrder', msg: 'sortOrder must be ASC or DESC' });
  }
  for (const field of ['userId', 'bookId', 'authorId', 'categoryId', 'departmentId', 'materialTypeId', 'publisherId', 'roleId']) {
    if (filters[field] !== undefined && filters[field] !== '' && !/^\d+$/.test(String(filters[field]))) {
      errors.push({ path: field, msg: `${field} must be a positive integer` });
    }
  }
  if (filters.search && String(filters.search).length > 200) {
    errors.push({ path: 'search', msg: 'Search cannot exceed 200 characters' });
  }

  if (errors.length) return ResponseFormatter.validationError(res, errors);
  req.reportFilters = filters;
  next();
}

module.exports = { REPORT_TYPES, validateReportRequest };
