const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

const TIME_ZONE = 'Asia/Phnom_Penh';
const DAY_MS = 86_400_000;

const REPORT_TITLES = {
  overview: 'Overview Report',
  users: 'Users Report',
  logins: 'User Login Report',
  books: 'Books Report',
  'book-views': 'Book Views Report',
  downloads: 'Downloads Report',
  'reading-progress': 'Reading Progress Report',
  reviews: 'Reviews and Ratings Report',
  feedback: 'Feedback Report',
  authors: 'Authors Report',
  categories: 'Categories Report',
  departments: 'Departments Report',
  activities: 'Admin Activity Report',
};

function localDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function dateKey(date = new Date()) {
  const { year, month, day } = localDateParts(date);
  return `${year}-${month}-${day}`;
}

function addDays(key, amount) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function startOfWeek(key) {
  const [year, month, day] = key.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDays(key, -(weekday === 0 ? 6 : weekday - 1));
}

function resolveDateRange(filters = {}) {
  const today = dateKey();
  const periodAliases = { daily: 'today', weekly: 'this_week', monthly: 'this_month', yearly: 'this_year' };
  const period = periodAliases[filters.period] || filters.period || 'this_month';
  const [year, month] = today.split('-').map(Number);
  let startDate;
  let endDate;

  switch (period) {
    case 'today': startDate = endDate = today; break;
    case 'yesterday': startDate = endDate = addDays(today, -1); break;
    case 'last_7_days': startDate = addDays(today, -6); endDate = today; break;
    case 'this_week': startDate = startOfWeek(today); endDate = addDays(startDate, 6); break;
    case 'last_week': endDate = addDays(startOfWeek(today), -1); startDate = addDays(endDate, -6); break;
    case 'last_month': {
      const firstThisMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      endDate = addDays(firstThisMonth, -1);
      startDate = `${endDate.slice(0, 7)}-01`;
      break;
    }
    case 'this_year': startDate = `${year}-01-01`; endDate = `${year}-12-31`; break;
    case 'last_year': startDate = `${year - 1}-01-01`; endDate = `${year - 1}-12-31`; break;
    case 'custom': startDate = filters.startDate; endDate = filters.endDate; break;
    case 'this_month':
    default: {
      startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
      endDate = addDays(nextMonth, -1);
      break;
    }
  }

  const startUtc = new Date(`${startDate}T00:00:00+07:00`);
  const endUtc = new Date(`${addDays(endDate, 1)}T00:00:00+07:00`);
  const duration = endUtc.getTime() - startUtc.getTime();
  return {
    period,
    startDate,
    endDate,
    startUtc,
    endUtc,
    previousStartUtc: new Date(startUtc.getTime() - duration),
    previousEndUtc: startUtc,
  };
}

function normalizeFilters(input = {}) {
  const range = resolveDateRange(input);
  const page = Math.max(1, Number.parseInt(input.page, 10) || 1);
  const maximumLimit = input.exportAll ? 5_000 : 100;
  const limit = Math.min(maximumLimit, Math.max(1, Number.parseInt(input.limit, 10) || 20));
  return {
    ...input,
    ...range,
    page,
    limit,
    search: typeof input.search === 'string' ? input.search.trim() : '',
    sortOrder: String(input.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
  };
}

function replacementsFor(filters) {
  return {
    startUtc: filters.startUtc,
    endUtc: filters.endUtc,
    previousStartUtc: filters.previousStartUtc,
    previousEndUtc: filters.previousEndUtc,
    timeZone: TIME_ZONE,
    search: `%${filters.search}%`,
  };
}

function numericRecord(record) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => {
    if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) return [key, Number(value)];
    return [key, value];
  }));
}

async function runPaged(baseSql, replacements, filters, sortMap, defaultSort) {
  const sortColumn = sortMap[filters.sortBy] || sortMap[defaultSort];
  const offset = (filters.page - 1) * filters.limit;
  const [countRows, rows] = await Promise.all([
    sequelize.query(`SELECT COUNT(*)::integer AS total FROM (${baseSql}) report_count`, {
      replacements,
      type: QueryTypes.SELECT,
    }),
    sequelize.query(
      `SELECT * FROM (${baseSql}) report_rows
       ORDER BY ${sortColumn} ${filters.sortOrder}, "id" DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...replacements, limit: filters.limit, offset },
        type: QueryTypes.SELECT,
      },
    ),
  ]);
  const totalItems = Number(countRows[0]?.total || 0);
  return {
    records: rows.map(numericRecord),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / filters.limit)),
    },
  };
}

async function summaryFromBase(baseSql, replacements, selectSql) {
  const [row = {}] = await sequelize.query(`SELECT ${selectSql} FROM (${baseSql}) report_summary`, {
    replacements,
    type: QueryTypes.SELECT,
  });
  return numericRecord(row);
}

async function trend(table, dateColumn, filters, extraWhere = 'TRUE', extra = {}) {
  return sequelize.query(
    `SELECT TO_CHAR(DATE_TRUNC('day', ${dateColumn} AT TIME ZONE :timeZone), 'YYYY-MM-DD') AS label,
            COUNT(*)::integer AS value
     FROM ${table}
     WHERE ${dateColumn} >= :startUtc AND ${dateColumn} < :endUtc AND ${extraWhere}
     GROUP BY 1 ORDER BY 1`,
    { replacements: { ...replacementsFor(filters), ...extra }, type: QueryTypes.SELECT },
  ).then((rows) => rows.map(numericRecord));
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function response(filters, result, summary, charts = {}, meta = {}) {
  return {
    summary,
    charts,
    records: result.records,
    pagination: result.pagination,
    filters: {
      period: filters.period,
      startDate: filters.startDate,
      endDate: filters.endDate,
      search: filters.search || undefined,
      status: filters.status || undefined,
      sortBy: filters.sortBy || undefined,
      sortOrder: filters.sortOrder,
    },
    meta: { timeZone: TIME_ZONE, ...meta },
  };
}

async function overviewReport(filters) {
  const replacements = replacementsFor(filters);
  const [summaryRow] = await sequelize.query(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE is_deleted = FALSE)::integer AS "totalUsers",
      (SELECT COUNT(*) FROM users WHERE is_deleted = FALSE AND is_active = TRUE)::integer AS "activeUsers",
      (SELECT COUNT(*) FROM users WHERE is_deleted = FALSE AND is_active = FALSE)::integer AS "inactiveUsers",
      (SELECT COUNT(*) FROM users WHERE is_deleted = FALSE AND created_at >= :startUtc AND created_at < :endUtc)::integer AS "newUsers",
      (SELECT COUNT(*) FROM books WHERE is_deleted = FALSE)::integer AS "totalBooks",
      (SELECT COUNT(*) FROM books WHERE is_deleted = FALSE AND is_active = TRUE)::integer AS "activeBooks",
      (SELECT COALESCE(SUM(views), 0) FROM books WHERE is_deleted = FALSE)::bigint AS "totalBookViews",
      (SELECT COUNT(*) FROM downloads WHERE downloaded_at >= :startUtc AND downloaded_at < :endUtc)::integer AS "totalDownloads",
      (SELECT COUNT(*) FROM reviews WHERE is_deleted = FALSE AND created_at >= :startUtc AND created_at < :endUtc)::integer AS "totalReviews",
      (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM reviews WHERE is_deleted = FALSE AND created_at >= :startUtc AND created_at < :endUtc) AS "averageBookRating",
      (SELECT COUNT(*) FROM reading_progress WHERE last_read_at >= :startUtc AND last_read_at < :endUtc)::integer AS "totalReadingSessions",
      (SELECT COUNT(*) FROM reading_progress WHERE completed_at >= :startUtc AND completed_at < :endUtc)::integer AS "totalCompletedBooks",
      (SELECT COUNT(*) FROM bookmarks WHERE created_at >= :startUtc AND created_at < :endUtc)::integer AS "totalBookmarks",
      (SELECT COUNT(*) FROM reading_notes WHERE created_at >= :startUtc AND created_at < :endUtc)::integer AS "totalReadingNotes",
      (SELECT COUNT(*) FROM feedbacks WHERE created_at >= :startUtc AND created_at < :endUtc)::integer AS "totalFeedback"`,
    { replacements, type: QueryTypes.SELECT },
  );
  const [previous] = await sequelize.query(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE is_deleted = FALSE AND created_at >= :previousStartUtc AND created_at < :previousEndUtc)::integer AS "newUsers",
      (SELECT COUNT(*) FROM downloads WHERE downloaded_at >= :previousStartUtc AND downloaded_at < :previousEndUtc)::integer AS "totalDownloads",
      (SELECT COUNT(*) FROM reviews WHERE is_deleted = FALSE AND created_at >= :previousStartUtc AND created_at < :previousEndUtc)::integer AS "totalReviews",
      (SELECT COUNT(*) FROM feedbacks WHERE created_at >= :previousStartUtc AND created_at < :previousEndUtc)::integer AS "totalFeedback"`,
    { replacements, type: QueryTypes.SELECT },
  );
  const topBooks = await sequelize.query(
    `SELECT b.id::text, b.title, b.views::integer, b.downloads::integer,
            COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS "averageRating"
     FROM books b LEFT JOIN reviews r ON r.book_id = b.id AND r.is_deleted = FALSE
     WHERE b.is_deleted = FALSE
     GROUP BY b.id ORDER BY b.views DESC, b.downloads DESC LIMIT 10`,
    { type: QueryTypes.SELECT },
  );
  const roles = await sequelize.query(
    `SELECT r.name AS label, COUNT(DISTINCT ur.user_id)::integer AS value
     FROM roles r LEFT JOIN users_roles ur ON ur.role_id = r.id
     GROUP BY r.id ORDER BY value DESC`,
    { type: QueryTypes.SELECT },
  );
  const summary = numericRecord(summaryRow);
  const comparisons = {
    newUsers: percentChange(summary.newUsers, Number(previous.newUsers)),
    totalDownloads: percentChange(summary.totalDownloads, Number(previous.totalDownloads)),
    totalReviews: percentChange(summary.totalReviews, Number(previous.totalReviews)),
    totalFeedback: percentChange(summary.totalFeedback, Number(previous.totalFeedback)),
  };
  return response(
    filters,
    { records: topBooks.map(numericRecord), pagination: { page: 1, limit: 10, totalItems: topBooks.length, totalPages: 1 } },
    summary,
    { trend: await trend('downloads', 'downloaded_at', filters), distribution: roles.map(numericRecord), topItems: topBooks.map(numericRecord) },
    { comparisons },
  );
}

async function usersReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = ['u.is_deleted = FALSE', 'u.created_at >= :startUtc', 'u.created_at < :endUtc'];
  if (filters.search) conditions.push(`(u.username ILIKE :search OR u.email ILIKE :search OR u.student_id ILIKE :search OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE :search)`);
  if (filters.status === 'active') conditions.push('u.is_active = TRUE');
  if (filters.status === 'inactive') conditions.push('u.is_active = FALSE');
  if (filters.roleId) { conditions.push('EXISTS (SELECT 1 FROM users_roles urf WHERE urf.user_id = u.id AND urf.role_id = :roleId)'); replacements.roleId = filters.roleId; }
  if (filters.activity === 'none') conditions.push('NOT EXISTS (SELECT 1 FROM activities ax WHERE ax.user_id = u.id)');

  const base = `SELECT u.id::text AS id, u.student_id AS "studentId",
      COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) AS "fullName",
      u.username, u.email,
      COALESCE((SELECT STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name) FROM users_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id), 'user') AS role,
      CASE WHEN u.is_active THEN 'Active' ELSE 'Inactive' END AS status,
      u.created_at AS "registeredAt",
      (SELECT MAX(a.created_at) FROM activities a WHERE a.user_id = u.id AND a.action IN ('login', 'login_success')) AS "lastLogin",
      (SELECT COUNT(*) FROM activities a WHERE a.user_id = u.id AND a.action IN ('login', 'login_success'))::integer AS "loginCount",
      0::integer AS "booksViewed",
      (SELECT COUNT(*) FROM downloads d WHERE d.user_id = u.id)::integer AS downloads,
      (SELECT COUNT(*) FROM reading_progress rp WHERE rp.user_id = u.id)::integer AS "readingSessions",
      (SELECT COUNT(*) FROM bookmarks bm WHERE bm.user_id = u.id)::integer AS bookmarks,
      (SELECT COUNT(*) FROM reading_notes rn WHERE rn.user_id = u.id)::integer AS notes,
      (SELECT COUNT(*) FROM reviews rv WHERE rv.user_id = u.id AND rv.is_deleted = FALSE)::integer AS reviews,
      COALESCE((SELECT ROUND(AVG(rp.progress_percentage)::numeric, 1) FROM reading_progress rp WHERE rp.user_id = u.id), 0) AS "averageProgress",
      (SELECT COUNT(*) FROM reading_progress rp WHERE rp.user_id = u.id AND rp.completed_at IS NOT NULL)::integer AS "completedBooks"
    FROM users u WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, {
    registeredAt: '"registeredAt"', fullName: '"fullName"', downloads: 'downloads', averageProgress: '"averageProgress"', loginCount: '"loginCount"',
  }, 'registeredAt');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalUsers", COUNT(*) FILTER (WHERE status = 'Active')::integer AS "activeUsers",
     COUNT(*) FILTER (WHERE status = 'Inactive')::integer AS "inactiveUsers", COALESCE(SUM(downloads), 0)::integer AS "totalDownloads",
     COALESCE(ROUND(AVG("averageProgress")::numeric, 1), 0) AS "averageProgress"`);
  const distribution = await sequelize.query(
    `SELECT role AS label, COUNT(*)::integer AS value FROM (${base}) users_chart GROUP BY role ORDER BY value DESC`,
    { replacements, type: QueryTypes.SELECT },
  );
  return response(filters, result, summary, { trend: await trend('users', 'created_at', filters, 'is_deleted = FALSE'), distribution: distribution.map(numericRecord) }, { booksViewedTracking: 'not_available_without_book_view_histories' });
}

async function loginsReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = [`a.action IN ('login', 'login_success', 'login_failed', 'login_2fa_pending')`, 'a.created_at >= :startUtc', 'a.created_at < :endUtc'];
  if (filters.search) conditions.push(`(u.username ILIKE :search OR u.email ILIKE :search OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE :search)`);
  if (filters.status === 'success') conditions.push(`a.action IN ('login', 'login_success')`);
  if (filters.status === 'failed') conditions.push(`a.action = 'login_failed'`);
  const base = `SELECT a.id::text AS id, u.id::text AS "userId",
      COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username, 'Unknown user') AS "user",
      COALESCE(a.metadata->>'loginMethod', 'password') AS "loginMethod",
      a.metadata->>'ipAddress' AS "ipAddress", a.metadata->>'deviceType' AS "deviceType",
      a.metadata->>'browser' AS browser, a.metadata->>'operatingSystem' AS "operatingSystem",
      CASE WHEN a.action = 'login_failed' THEN 'Failed' WHEN a.action = 'login_2fa_pending' THEN 'Pending 2FA' ELSE 'Successful' END AS status,
      a.metadata->>'failureReason' AS "failureReason", a.created_at AS "loggedInAt"
    FROM activities a LEFT JOIN users u ON u.id = a.user_id WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, { loggedInAt: '"loggedInAt"', user: '"user"', status: 'status' }, 'loggedInAt');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalAttempts", COUNT(*) FILTER (WHERE status = 'Successful')::integer AS "successfulLogins",
     COUNT(*) FILTER (WHERE status = 'Failed')::integer AS "failedLogins", COUNT(DISTINCT "userId")::integer AS "uniqueUsers",
     COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'Successful') / NULLIF(COUNT(*), 0), 1), 0) AS "successRate"`);
  return response(filters, result, summary, {
    trend: await trend('activities', 'created_at', filters, `action IN ('login', 'login_success', 'login_failed', 'login_2fa_pending')`),
    distribution: [{ label: 'Successful', value: summary.successfulLogins }, { label: 'Failed', value: summary.failedLogins }],
  }, { source: 'activities', historyCoverage: 'Only recorded login activities are included' });
}

function bookBase(filters, replacements) {
  const conditions = ['b.is_deleted = FALSE', 'b.created_at >= :startUtc', 'b.created_at < :endUtc'];
  if (filters.search) conditions.push('(b.title ILIKE :search OR b.title_kh ILIKE :search OR b.isbn ILIKE :search)');
  if (filters.status === 'active') conditions.push('b.is_active = TRUE');
  if (filters.status === 'inactive') conditions.push('b.is_active = FALSE');
  for (const [filter, column] of [['categoryId', 'b.category_id'], ['departmentId', 'b.department_id'], ['materialTypeId', 'b.type_id'], ['publisherId', 'b.publisher_id']]) {
    if (filters[filter]) { conditions.push(`${column} = :${filter}`); replacements[filter] = filters[filter]; }
  }
  if (filters.language) { conditions.push('b.language = :language'); replacements.language = filters.language; }
  return `SELECT b.id::text AS id, b.cover_url AS "coverUrl", b.title, b.title_kh AS "titleKh", b.isbn,
      COALESCE((SELECT STRING_AGG(a.name, ', ' ORDER BY ba.is_primary_author DESC, a.name) FROM books_authors ba JOIN authors a ON a.id = ba.author_id WHERE ba.book_id = b.id), 'Unknown') AS authors,
      c.name AS category, dep.name AS department, mt.name AS "materialType", p.name AS publisher,
      b.language, b.publication_year AS "publicationYear", b.pages AS "totalPages",
      CASE WHEN b.is_active THEN 'Active' ELSE 'Inactive' END AS status, b.created_at AS "createdAt",
      b.views::integer AS views, b.downloads::integer AS downloads,
      (SELECT COUNT(*) FROM reviews r WHERE r.book_id = b.id AND r.is_deleted = FALSE)::integer AS reviews,
      COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM reviews r WHERE r.book_id = b.id AND r.is_deleted = FALSE), 0) AS "averageRating",
      (SELECT COUNT(*) FROM bookmarks bm WHERE bm.book_id = b.id)::integer AS bookmarks,
      (SELECT COUNT(*) FROM reading_notes rn WHERE rn.book_id = b.id)::integer AS notes,
      (SELECT COUNT(DISTINCT rp.user_id) FROM reading_progress rp WHERE rp.book_id = b.id)::integer AS readers,
      (SELECT COUNT(*) FROM reading_progress rp WHERE rp.book_id = b.id AND rp.completed_at IS NOT NULL)::integer AS "completedReaders",
      COALESCE((SELECT ROUND(AVG(rp.progress_percentage)::numeric, 1) FROM reading_progress rp WHERE rp.book_id = b.id), 0) AS "averageProgress"
    FROM books b
    LEFT JOIN categories c ON c.id = b.category_id LEFT JOIN departments dep ON dep.id = b.department_id
    LEFT JOIN material_types mt ON mt.id = b.type_id LEFT JOIN publishers p ON p.id = b.publisher_id
    WHERE ${conditions.join(' AND ')}`;
}

async function booksReport(filters) {
  const replacements = replacementsFor(filters);
  const base = bookBase(filters, replacements);
  const result = await runPaged(base, replacements, filters, {
    createdAt: '"createdAt"', title: 'title', views: 'views', downloads: 'downloads', averageRating: '"averageRating"', reviews: 'reviews',
  }, 'createdAt');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalBooks", COUNT(*) FILTER (WHERE status = 'Active')::integer AS "activeBooks",
     COALESCE(SUM(views), 0)::bigint AS "totalViews", COALESCE(SUM(downloads), 0)::bigint AS "totalDownloads",
     COALESCE(SUM(reviews), 0)::integer AS "totalReviews", COALESCE(ROUND(AVG("averageRating")::numeric, 2), 0) AS "averageRating"`);
  const distribution = await sequelize.query(
    `SELECT COALESCE(category, 'Uncategorized') AS label, COUNT(*)::integer AS value FROM (${base}) books_chart GROUP BY category ORDER BY value DESC LIMIT 12`,
    { replacements, type: QueryTypes.SELECT },
  );
  return response(filters, result, summary, { trend: await trend('books', 'created_at', filters, 'is_deleted = FALSE'), distribution: distribution.map(numericRecord) });
}

async function bookViewsReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = ['b.is_deleted = FALSE'];
  if (filters.search) conditions.push('(b.title ILIKE :search OR b.isbn ILIKE :search)');
  if (filters.categoryId) { conditions.push('b.category_id = :categoryId'); replacements.categoryId = filters.categoryId; }
  if (filters.departmentId) { conditions.push('b.department_id = :departmentId'); replacements.departmentId = filters.departmentId; }
  const base = `SELECT b.id::text AS id, b.title, b.views::integer AS "totalViews", c.name AS category,
      dep.name AS department, mt.name AS "materialType", NULL::integer AS "uniqueViewers",
      NULL::integer AS "guestViews", NULL::integer AS "authenticatedViews", b.updated_at AS "lastUpdatedAt"
    FROM books b LEFT JOIN categories c ON c.id = b.category_id LEFT JOIN departments dep ON dep.id = b.department_id
    LEFT JOIN material_types mt ON mt.id = b.type_id WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, { totalViews: '"totalViews"', title: 'title' }, 'totalViews');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalBooks", COALESCE(SUM("totalViews"), 0)::bigint AS "totalViews",
     COUNT(*) FILTER (WHERE "totalViews" = 0)::integer AS "booksWithNoViews"`);
  return response(filters, result, summary, { topItems: result.records.slice(0, 10).map((book) => ({ label: book.title, value: book.totalViews })) }, {
    trackingLevel: 'lifetime_aggregate',
    notice: 'Unique, guest, authenticated, and time-series views require book_view_histories.',
  });
}

async function downloadsReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = ['d.downloaded_at >= :startUtc', 'd.downloaded_at < :endUtc'];
  if (filters.search) conditions.push(`(b.title ILIKE :search OR b.isbn ILIKE :search OR u.username ILIKE :search OR u.email ILIKE :search OR u.student_id ILIKE :search OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE :search)`);
  for (const [filter, column] of [['userId', 'd.user_id'], ['bookId', 'd.book_id'], ['categoryId', 'b.category_id'], ['departmentId', 'b.department_id'], ['materialTypeId', 'b.type_id']]) {
    if (filters[filter]) { conditions.push(`${column} = :${filter}`); replacements[filter] = filters[filter]; }
  }
  const base = `SELECT d.id::text AS id, d.user_id::text AS "userId",
      COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) AS "user",
      u.student_id AS "studentId", b.id::text AS "bookId", b.title AS book, b.cover_url AS "coverUrl", b.isbn,
      COALESCE((SELECT STRING_AGG(a.name, ', ') FROM books_authors ba JOIN authors a ON a.id = ba.author_id WHERE ba.book_id = b.id), 'Unknown') AS author,
      c.name AS category, dep.name AS department, mt.name AS "materialType", d.downloaded_at AS "downloadedAt", d.ip_address AS "ipAddress",
      COUNT(*) OVER (PARTITION BY d.book_id)::integer AS "downloadsPerBook",
      COUNT(*) OVER (PARTITION BY d.user_id)::integer AS "downloadsPerUser"
    FROM downloads d JOIN users u ON u.id = d.user_id JOIN books b ON b.id = d.book_id
    LEFT JOIN categories c ON c.id = b.category_id LEFT JOIN departments dep ON dep.id = b.department_id
    LEFT JOIN material_types mt ON mt.id = b.type_id WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, { downloadedAt: '"downloadedAt"', book: 'book', user: '"user"', downloadsPerBook: '"downloadsPerBook"' }, 'downloadedAt');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalDownloads", COUNT(DISTINCT "bookId")::integer AS "uniqueBooks",
     COUNT(DISTINCT "userId")::integer AS "uniqueUsers", COALESCE(MAX("downloadsPerBook"), 0)::integer AS "topBookDownloads",
     COALESCE(MAX("downloadsPerUser"), 0)::integer AS "topUserDownloads"`);
  const distribution = await sequelize.query(
    `SELECT book AS label, COUNT(*)::integer AS value FROM (${base}) downloads_chart GROUP BY book ORDER BY value DESC LIMIT 10`,
    { replacements, type: QueryTypes.SELECT },
  );
  return response(filters, result, summary, { trend: await trend('downloads', 'downloaded_at', filters), distribution: distribution.map(numericRecord) });
}

async function readingProgressReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = ['rp.last_read_at >= :startUtc', 'rp.last_read_at < :endUtc'];
  if (filters.search) conditions.push(`(b.title ILIKE :search OR u.username ILIKE :search OR u.student_id ILIKE :search OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE :search)`);
  for (const [filter, column] of [['userId', 'rp.user_id'], ['bookId', 'rp.book_id'], ['categoryId', 'b.category_id'], ['departmentId', 'b.department_id']]) {
    if (filters[filter]) { conditions.push(`${column} = :${filter}`); replacements[filter] = filters[filter]; }
  }
  const core = `SELECT rp.id::text AS id, rp.user_id::text AS "userId",
      COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) AS "user", u.student_id AS "studentId",
      b.id::text AS "bookId", b.title AS book, rp.current_page AS "currentPage", rp.total_pages AS "totalPages",
      ROUND(rp.progress_percentage::numeric, 1) AS "progressPercentage", rp.last_read_at AS "lastReadAt", rp.completed_at AS "completedAt",
      CASE WHEN rp.completed_at IS NOT NULL OR rp.progress_percentage >= 100 THEN 'Completed'
           WHEN rp.last_read_at < NOW() - INTERVAL '30 days' THEN 'Inactive Reading' ELSE 'In Progress' END AS "readingStatus"
    FROM reading_progress rp JOIN users u ON u.id = rp.user_id JOIN books b ON b.id = rp.book_id
    WHERE ${conditions.join(' AND ')}`;
  const base = filters.status && filters.status !== 'all'
    ? `SELECT * FROM (${core}) reading_filtered WHERE "readingStatus" = :readingStatus`
    : core;
  if (filters.status && filters.status !== 'all') replacements.readingStatus = filters.status;
  const result = await runPaged(base, replacements, filters, { lastReadAt: '"lastReadAt"', progressPercentage: '"progressPercentage"', user: '"user"', book: 'book' }, 'lastReadAt');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(DISTINCT "userId")::integer AS "activeReaders", COUNT(DISTINCT "bookId")::integer AS "booksBeingRead",
     COUNT(*) FILTER (WHERE "readingStatus" = 'Completed')::integer AS "completedBooks",
     COALESCE(ROUND(AVG("progressPercentage")::numeric, 1), 0) AS "averageProgress",
     COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE "readingStatus" = 'Completed') / NULLIF(COUNT(*), 0), 1), 0) AS "completionRate",
     COUNT(*) FILTER (WHERE "readingStatus" = 'Inactive Reading')::integer AS "inactiveReaders"`);
  return response(filters, result, summary, {
    trend: await trend('reading_progress', 'last_read_at', filters),
    distribution: ['Completed', 'In Progress', 'Inactive Reading'].map((label) => ({ label, value: result.records.filter((row) => row.readingStatus === label).length })),
  });
}

async function reviewsReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = ['r.created_at >= :startUtc', 'r.created_at < :endUtc'];
  if (filters.search) conditions.push(`(b.title ILIKE :search OR u.username ILIKE :search OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE :search OR r.comment ILIKE :search)`);
  if (filters.rating) { conditions.push('r.rating = :rating'); replacements.rating = filters.rating; }
  if (filters.status === 'active') conditions.push('r.is_deleted = FALSE');
  else if (filters.status === 'deleted') conditions.push('r.is_deleted = TRUE');
  for (const [filter, column] of [['userId', 'r.user_id'], ['bookId', 'r.book_id'], ['categoryId', 'b.category_id'], ['departmentId', 'b.department_id']]) {
    if (filters[filter]) { conditions.push(`${column} = :${filter}`); replacements[filter] = filters[filter]; }
  }
  const base = `SELECT r.id::text AS id,
      COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) AS "user", b.title AS book,
      r.rating::integer, r.comment, CASE WHEN r.is_deleted THEN 'Deleted' ELSE 'Active' END AS status,
      c.name AS category, dep.name AS department, r.created_at AS "createdAt", r.updated_at AS "updatedAt"
    FROM reviews r JOIN users u ON u.id = r.user_id JOIN books b ON b.id = r.book_id
    LEFT JOIN categories c ON c.id = b.category_id LEFT JOIN departments dep ON dep.id = b.department_id
    WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, { createdAt: '"createdAt"', rating: 'rating', book: 'book', user: '"user"' }, 'createdAt');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalReviews", COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS "averageRating",
     COUNT(*) FILTER (WHERE rating = 5)::integer AS "fiveStars", COUNT(*) FILTER (WHERE rating = 4)::integer AS "fourStars",
     COUNT(*) FILTER (WHERE rating = 3)::integer AS "threeStars", COUNT(*) FILTER (WHERE rating = 2)::integer AS "twoStars",
     COUNT(*) FILTER (WHERE rating = 1)::integer AS "oneStar"`);
  return response(filters, result, summary, {
    trend: await trend('reviews', 'created_at', filters, filters.status === 'deleted' ? 'is_deleted = TRUE' : 'is_deleted = FALSE'),
    distribution: [5, 4, 3, 2, 1].map((rating) => ({ label: `${rating} Stars`, value: summary[['oneStar', 'twoStars', 'threeStars', 'fourStars', 'fiveStars'][rating - 1]] })),
  });
}

async function feedbackReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = ['f.created_at >= :startUtc', 'f.created_at < :endUtc'];
  if (filters.search) conditions.push(`(f.subject ILIKE :search OR f.message ILIKE :search OR f.name ILIKE :search OR f.email ILIKE :search OR u.username ILIKE :search)`);
  if (filters.status && filters.status !== 'all') { conditions.push('f.status = :status'); replacements.status = filters.status; }
  if (filters.feedbackType) { conditions.push('f.type = :feedbackType'); replacements.feedbackType = filters.feedbackType; }
  const base = `SELECT f.id::text AS id, u.id::text AS "userId", COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username, f.name, 'Anonymous') AS "user",
      COALESCE(u.email, f.email) AS email, f.type, f.subject, f.message, f.rating::integer, f.status,
      f.admin_notes AS "adminNotes", COALESCE(NULLIF(TRIM(CONCAT_WS(' ', resolver.first_name, resolver.last_name)), ''), resolver.username) AS "resolvedBy",
      f.created_at AS "createdAt", f.resolved_at AS "resolvedAt"
    FROM feedbacks f LEFT JOIN users u ON u.id = f.user_id LEFT JOIN users resolver ON resolver.id = f.resolved_by
    WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, { createdAt: '"createdAt"', status: 'status', rating: 'rating', user: '"user"' }, 'createdAt');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalFeedback", COUNT(*) FILTER (WHERE status = 'new')::integer AS "newFeedback",
     COUNT(*) FILTER (WHERE status = 'in_progress')::integer AS "inProgress", COUNT(*) FILTER (WHERE status = 'resolved')::integer AS resolved,
     COUNT(*) FILTER (WHERE status = 'closed')::integer AS closed, COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS "averageRating"`);
  const distribution = await sequelize.query(
    `SELECT status AS label, COUNT(*)::integer AS value FROM (${base}) feedback_chart GROUP BY status ORDER BY value DESC`,
    { replacements, type: QueryTypes.SELECT },
  );
  return response(filters, result, summary, { trend: await trend('feedbacks', 'created_at', filters), distribution: distribution.map(numericRecord) });
}

async function authorsReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = ['TRUE'];
  if (filters.search) conditions.push('(a.name ILIKE :search OR a.name_kh ILIKE :search)');
  const base = `SELECT a.id::text AS id, a.name, a.name_kh AS "nameKh",
      (SELECT COUNT(*) FROM books_authors bax JOIN books bx ON bx.id = bax.book_id
       WHERE bax.author_id = a.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc)::integer AS "totalBooks",
      COALESCE((SELECT SUM(bx.views) FROM books_authors bax JOIN books bx ON bx.id = bax.book_id
       WHERE bax.author_id = a.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc), 0)::bigint AS "totalViews",
      COALESCE((SELECT SUM(bx.downloads) FROM books_authors bax JOIN books bx ON bx.id = bax.book_id
       WHERE bax.author_id = a.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc), 0)::bigint AS "totalDownloads",
      (SELECT COUNT(*) FROM books_authors bax JOIN books bx ON bx.id = bax.book_id JOIN reviews rx ON rx.book_id = bx.id AND rx.is_deleted = FALSE
       WHERE bax.author_id = a.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc)::integer AS "totalReviews",
      COALESCE((SELECT ROUND(AVG(rx.rating)::numeric, 2) FROM books_authors bax JOIN books bx ON bx.id = bax.book_id JOIN reviews rx ON rx.book_id = bx.id AND rx.is_deleted = FALSE
       WHERE bax.author_id = a.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc), 0) AS "averageRating",
      (SELECT bx.title FROM books_authors bax JOIN books bx ON bx.id = bax.book_id WHERE bax.author_id = a.id AND bx.is_deleted = FALSE ORDER BY bx.views DESC, bx.downloads DESC LIMIT 1) AS "mostPopularBook"
    FROM authors a WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, { name: 'name', totalBooks: '"totalBooks"', totalViews: '"totalViews"', totalDownloads: '"totalDownloads"', averageRating: '"averageRating"' }, 'totalBooks');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalAuthors", COALESCE(SUM("totalBooks"), 0)::integer AS "totalBooks",
     COALESCE(SUM("totalViews"), 0)::bigint AS "totalViews", COALESCE(SUM("totalDownloads"), 0)::bigint AS "totalDownloads"`);
  return response(filters, result, summary, { distribution: result.records.slice(0, 10).map((row) => ({ label: row.name, value: row.totalBooks })) });
}

async function groupedCatalogReport(filters, type) {
  const config = type === 'categories'
    ? { table: 'categories', foreignKey: 'category_id', label: 'category' }
    : { table: 'departments', foreignKey: 'department_id', label: 'department' };
  const replacements = replacementsFor(filters);
  const conditions = ['TRUE'];
  if (filters.search) conditions.push('(g.name ILIKE :search OR g.name_kh ILIKE :search)');
  const base = `SELECT g.id::text AS id, g.name AS ${config.label}, g.name_kh AS "nameKh",
      (SELECT COUNT(*) FROM books bx WHERE bx.${config.foreignKey} = g.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc)::integer AS "totalBooks",
      (SELECT COUNT(*) FROM books bx WHERE bx.${config.foreignKey} = g.id AND bx.is_deleted = FALSE AND bx.is_active = TRUE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc)::integer AS "activeBooks",
      COALESCE((SELECT SUM(bx.views) FROM books bx WHERE bx.${config.foreignKey} = g.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc), 0)::bigint AS "totalViews",
      COALESCE((SELECT SUM(bx.downloads) FROM books bx WHERE bx.${config.foreignKey} = g.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc), 0)::bigint AS "totalDownloads",
      (SELECT COUNT(*) FROM books bx JOIN reviews rx ON rx.book_id = bx.id AND rx.is_deleted = FALSE WHERE bx.${config.foreignKey} = g.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc)::integer AS "totalReviews",
      COALESCE((SELECT ROUND(AVG(rx.rating)::numeric, 2) FROM books bx JOIN reviews rx ON rx.book_id = bx.id AND rx.is_deleted = FALSE WHERE bx.${config.foreignKey} = g.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc), 0) AS "averageRating",
      (SELECT COUNT(DISTINCT rp.user_id) FROM books bx JOIN reading_progress rp ON rp.book_id = bx.id WHERE bx.${config.foreignKey} = g.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc)::integer AS "totalReaders",
      (SELECT COUNT(*) FROM books bx JOIN reading_progress rp ON rp.book_id = bx.id AND rp.completed_at IS NOT NULL WHERE bx.${config.foreignKey} = g.id AND bx.is_deleted = FALSE AND bx.created_at >= :startUtc AND bx.created_at < :endUtc)::integer AS "completedReadings"
    FROM ${config.table} g WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, { name: config.label, totalBooks: '"totalBooks"', totalViews: '"totalViews"', totalDownloads: '"totalDownloads"', averageRating: '"averageRating"' }, 'totalBooks');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalGroups", COALESCE(SUM("totalBooks"), 0)::integer AS "totalBooks",
     COALESCE(SUM("totalViews"), 0)::bigint AS "totalViews", COALESCE(SUM("totalDownloads"), 0)::bigint AS "totalDownloads"`);
  return response(filters, result, summary, { distribution: result.records.slice(0, 12).map((row) => ({ label: row[config.label], value: row.totalBooks })) });
}

async function activitiesReport(filters) {
  const replacements = replacementsFor(filters);
  const conditions = ['a.created_at >= :startUtc', 'a.created_at < :endUtc'];
  if (filters.search) conditions.push(`(a.action ILIKE :search OR a.target_name ILIKE :search OR u.username ILIKE :search OR u.email ILIKE :search OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE :search)`);
  if (filters.action && filters.action !== 'all') { conditions.push('a.action = :action'); replacements.action = filters.action; }
  if (filters.targetType && filters.targetType !== 'all') { conditions.push('a.target_type = :targetType'); replacements.targetType = filters.targetType; }
  if (filters.userId) { conditions.push('a.user_id = :userId'); replacements.userId = filters.userId; }
  const base = `SELECT a.id::text AS id, u.id::text AS "userId",
      COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username, 'System') AS "actor",
      COALESCE((SELECT STRING_AGG(r.name, ', ') FROM users_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id), 'system') AS role,
      a.action, a.target_type AS "targetType", a.target_id::text AS "targetId", a.target_name AS "targetName",
      a.metadata, a.created_at AS "createdAt"
    FROM activities a LEFT JOIN users u ON u.id = a.user_id WHERE ${conditions.join(' AND ')}`;
  const result = await runPaged(base, replacements, filters, { createdAt: '"createdAt"', actor: 'actor', action: 'action', targetType: '"targetType"' }, 'createdAt');
  const summary = await summaryFromBase(base, replacements,
    `COUNT(*)::integer AS "totalActivities", COUNT(DISTINCT "userId")::integer AS "uniqueActors",
     COUNT(DISTINCT action)::integer AS "actionTypes", COUNT(*) FILTER (WHERE action ILIKE '%deleted%')::integer AS "deleteActions"`);
  const distribution = await sequelize.query(
    `SELECT action AS label, COUNT(*)::integer AS value FROM (${base}) activities_chart GROUP BY action ORDER BY value DESC LIMIT 10`,
    { replacements, type: QueryTypes.SELECT },
  );
  return response(filters, result, summary, { trend: await trend('activities', 'created_at', filters), distribution: distribution.map(numericRecord) });
}

async function getReport(type, input = {}) {
  const filters = normalizeFilters(input);
  switch (type) {
    case 'overview': return overviewReport(filters);
    case 'users': return usersReport(filters);
    case 'logins': return loginsReport(filters);
    case 'books': return booksReport(filters);
    case 'book-views': return bookViewsReport(filters);
    case 'downloads': return downloadsReport(filters);
    case 'reading-progress': return readingProgressReport(filters);
    case 'reviews': return reviewsReport(filters);
    case 'feedback': return feedbackReport(filters);
    case 'authors': return authorsReport(filters);
    case 'categories': return groupedCatalogReport(filters, 'categories');
    case 'departments': return groupedCatalogReport(filters, 'departments');
    case 'activities': return activitiesReport(filters);
    default: throw Object.assign(new Error('Unsupported report type'), { status: 400, code: 'INVALID_REPORT_TYPE' });
  }
}

module.exports = { REPORT_TITLES, TIME_ZONE, getReport, resolveDateRange };
