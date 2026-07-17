// src/controllers/statsController.js
const {
    Book,
    User,
    Author,
    Category,
    Download,
    MaterialType,
    Role,
    Activity,
    sequelize,
} = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const ResponseFormatter = require("../utils/responseFormatter");

// ── In-memory cache for overview stats (TTL = 60s) 
let _overviewCache = null;
let _overviewCacheTime = 0;
const OVERVIEW_CACHE_TTL = 300_000; // 5 minutes

class StatsController {
    static async getOverview(req, res, next) {
        try {
            const { days = 7 } = req.query;
            const cacheKey = `overview_${days}`;

            // Return cached if fresh
            if (_overviewCache && _overviewCache._key === cacheKey &&
                Date.now() - _overviewCacheTime < OVERVIEW_CACHE_TTL) {
                return ResponseFormatter.success(res, _overviewCache);
            }

            // 1. Basic counts — run in parallel
            const basicCountsPromise = Promise.all([
                    Book.count({ where: { isDeleted: false } }).catch(err => { console.error("Error counting books:", err); return 0; }),
                    User.count({ where: { isDeleted: false } }).catch(err => { console.error("Error counting users:", err); return 0; }),
                    User.count({ where: { isActive: true, isDeleted: false } }).catch(err => { console.error("Error counting active users:", err); return 0; }),
                    Author.count().catch(err => { console.error("Error counting authors:", err); return 0; }),
                    Category.count().catch(err => { console.error("Error counting categories:", err); return 0; }),
                    Download.count().catch(err => { console.error("Error counting downloads:", err); return 0; }),
                ]);

            // ── Build activity where clause (needed by queries 5 & 6) ──
            let activityWhere = {};
            const dateLimit = new Date();
            const daysInt = parseInt(days);
            if (days !== 'all' && !isNaN(daysInt)) {
                if (daysInt === 1) {
                    dateLimit.setHours(0, 0, 0, 0);
                } else {
                    dateLimit.setDate(dateLimit.getDate() - daysInt);
                }
                activityWhere.createdAt = { [Op.gte]: dateLimit };
            }

            const currentYear = new Date().getFullYear();
            const startYear = currentYear - 4;
            const twelveMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 11));
            twelveMonthsAgo.setDate(1); // Start of month
            twelveMonthsAgo.setHours(0, 0, 0, 0);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
            thirtyDaysAgo.setHours(0, 0, 0, 0);

            // ── Run ALL independent queries in parallel 
            const [
                typeRows,
                yearRows,
                catViewRows,
                totalCount,
                activities,
                roleRows,
                // Time-series queries
                monthlyBookRows,
                monthlyJoinRows,
                monthlyDownloadRows,
                monthlyViewRows,
                dailyJoinRows,
                dailyDownloadRows,
                dailyViewRows,
                yearlyJoinRows,
                yearlyDownloadRows,
            ] = await Promise.all([
                // 2. Material type counts
                Book.findAll({
                    where: { isDeleted: false },
                    include: [{ model: MaterialType, as: 'MaterialType', attributes: ['name'] }],
                    attributes: [
                        'typeId',
                        [fn('COUNT', col('Book.id')), 'count'],
                    ],
                    group: ['typeId', 'MaterialType.id', 'MaterialType.name'],
                    raw: true,
                    nest: true,
                }).catch(err => { console.error("Error in query 2:", err); return []; }),

                // 3. Upload stats by year
                Book.findAll({
                    where: {
                        isDeleted: false,
                        [Op.and]: [
                            sequelize.where(col('Book.created_at'), {
                                [Op.gte]: new Date(`${startYear}-01-01`),
                            }),
                        ],
                    },
                    attributes: [
                        [fn('EXTRACT', literal("YEAR FROM \"created_at\"")), 'year'],
                        [fn('COUNT', col('id')), 'count'],
                    ],
                    group: [fn('EXTRACT', literal("YEAR FROM \"created_at\""))],
                    raw: true,
                }).catch(err => { console.error("Error in query 3:", err); return []; }),

                // 4. Category distribution + views
                Book.findAll({
                    where: { isDeleted: false },
                    include: [{ model: Category, as: 'Category', attributes: ['name'] }],
                    attributes: [
                        'categoryId',
                        [fn('COUNT', col('Book.id')), 'book_count'],
                        [fn('SUM', col('views')), 'total_views'],
                    ],
                    group: ['categoryId', 'Category.id', 'Category.name'],
                    order: [[fn('COUNT', col('Book.id')), 'DESC']],
                    subQuery: false,
                    raw: true,
                    nest: true,
                }).catch(err => { console.error("Error in query 4:", err); return []; }),

                // 5a. Activity count
                Activity.count({ where: activityWhere }).catch(err => { console.error("Error in query 5a:", err); return 0; }),

                // 5b. Recent activities
                Activity.findAll({
                    where: activityWhere,
                    include: [{
                        model: User,
                        as: 'User',
                        attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
                        include: [{ model: Role, as: 'Roles', attributes: ['name'] }]
                    }],
                    order: [['createdAt', 'DESC']],
                    limit: 10,
                    subQuery: false,
                }).catch(err => { console.error("Error in query 5b:", err); return []; }),

                // 6. Role activity stats
                Activity.findAll({
                    where: activityWhere,
                    attributes: [
                        'action',
                        [col('User->Roles.name'), 'roleName'],
                        [fn('COUNT', col('Activity.id')), 'count'],
                    ],
                    include: [{
                        model: User,
                        as: 'User',
                        attributes: [],
                        required: true,
                        include: [{
                            model: Role,
                            as: 'Roles',
                            attributes: [],
                            required: true,
                            through: { attributes: [] },
                        }],
                    }],
                    group: ['User->Roles.name', 'Activity.action'],
                    raw: true,
                }).catch(err => { console.error("Error in query 6:", err); return []; }),

                // 7. Monthly New Books
                Book.findAll({
                    where: { isDeleted: false, [Op.and]: [sequelize.where(col('Book.created_at'), { [Op.gte]: twelveMonthsAgo })] },
                    attributes: [[fn('TO_CHAR', col('created_at'), literal("'YYYY-MM'")), 'month'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('TO_CHAR', col('created_at'), literal("'YYYY-MM'"))],
                    raw: true,
                }).catch(err => { console.error("Error in query 7:", err); return []; }),

                // 8. Monthly User Joins
                User.findAll({
                    where: { isDeleted: false, [Op.and]: [sequelize.where(col('User.created_at'), { [Op.gte]: twelveMonthsAgo })] },
                    attributes: [[fn('TO_CHAR', col('created_at'), literal("'YYYY-MM'")), 'month'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('TO_CHAR', col('created_at'), literal("'YYYY-MM'"))],
                    raw: true,
                }).catch(err => { console.error("Error in query 8:", err); return []; }),

                // 9. Monthly Downloads
                Download.findAll({
                    where: { downloadedAt: { [Op.gte]: twelveMonthsAgo } },
                    attributes: [[fn('TO_CHAR', col('downloaded_at'), literal("'YYYY-MM'")), 'month'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('TO_CHAR', col('downloaded_at'), literal("'YYYY-MM'"))],
                    raw: true,
                }).catch(err => { console.error("Error in query 9:", err); return []; }),

                // 10. Monthly Views (from Activity)
                Activity.findAll({
                    where: { action: 'view', createdAt: { [Op.gte]: twelveMonthsAgo } },
                    attributes: [[fn('TO_CHAR', col('created_at'), literal("'YYYY-MM'")), 'month'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('TO_CHAR', col('created_at'), literal("'YYYY-MM'"))],
                    raw: true,
                }).catch(err => { console.error("Error in query 10:", err); return []; }),

                // 11. Daily Joins (last 30 days)
                User.findAll({
                    where: { isDeleted: false, [Op.and]: [sequelize.where(col('User.created_at'), { [Op.gte]: thirtyDaysAgo })] },
                    attributes: [[fn('TO_CHAR', col('created_at'), literal("'YYYY-MM-DD'")), 'date'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('TO_CHAR', col('created_at'), literal("'YYYY-MM-DD'"))],
                    raw: true,
                }).catch(err => { console.error("Error in query 11:", err); return []; }),

                // 12. Daily Downloads
                Download.findAll({
                    where: { downloadedAt: { [Op.gte]: thirtyDaysAgo } },
                    attributes: [[fn('TO_CHAR', col('downloaded_at'), literal("'YYYY-MM-DD'")), 'date'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('TO_CHAR', col('downloaded_at'), literal("'YYYY-MM-DD'"))],
                    raw: true,
                }).catch(err => { console.error("Error in query 12:", err); return []; }),

                // 13. Daily Views
                Activity.findAll({
                    where: { action: 'view', createdAt: { [Op.gte]: thirtyDaysAgo } },
                    attributes: [[fn('TO_CHAR', col('created_at'), literal("'YYYY-MM-DD'")), 'date'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('TO_CHAR', col('created_at'), literal("'YYYY-MM-DD'"))],
                    raw: true,
                }).catch(err => { console.error("Error in query 13:", err); return []; }),

                // 14. Yearly Joins
                User.findAll({
                    where: { isDeleted: false, [Op.and]: [sequelize.where(col('User.created_at'), { [Op.gte]: new Date(`${startYear}-01-01`) })] },
                    attributes: [[fn('EXTRACT', literal("YEAR FROM \"created_at\"")), 'year'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('EXTRACT', literal("YEAR FROM \"created_at\""))],
                    raw: true,
                }).catch(err => { console.error("Error in query 14:", err); return []; }),

                // 15. Yearly Downloads
                Download.findAll({
                    where: { downloadedAt: { [Op.gte]: new Date(`${startYear}-01-01`) } },
                    attributes: [[fn('EXTRACT', literal("YEAR FROM \"downloaded_at\"")), 'year'], [fn('COUNT', col('id')), 'count']],
                    group: [fn('EXTRACT', literal("YEAR FROM \"downloaded_at\""))],
                    raw: true,
                }).catch(err => { console.error("Error in query 15:", err); return []; }),
            ]);

            const [
                totalBooks,
                totalMembers,
                totalActiveMembers,
                totalAuthors,
                totalCategories,
                totalDownloads,
            ] = await basicCountsPromise;

            // ── Process results (pure JS, no DB) ──────

            // 1. Material type counts
            const typeCounts = { theses: 0, journals: 0, articles: 0 };
            for (const row of typeRows) {
                const name = (row.MaterialType?.name || row['MaterialType.name'] || "").toLowerCase();
                const cnt = parseInt(row.count) || 0;
                if (name.includes('thesis') || name.includes('dissertation')) typeCounts.theses += cnt;
                else if (name.includes('journal')) typeCounts.journals += cnt;
                else if (name.includes('article')) typeCounts.articles += cnt;
            }

            // 2. Yearly Upload stats (Books)
            const yearMap = {};
            for (const r of yearRows) yearMap[r.year] = parseInt(r.count) || 0;
            const uploadStats = [];
            for (let i = 4; i >= 0; i--) {
                const year = currentYear - i;
                const books = yearMap[year] || 0;
                uploadStats.push({
                    year,
                    books,
                    theses: Math.floor(books * 0.2),
                    journals: Math.floor(books * 0.1),
                });
            }

            // 3. Merged Monthly Trends (Joins, Downloads, Views, New Books)
            const monthlyTrends = [];
            const now = new Date();
            for (let i = 11; i >= 0; i--) {
                // Safe date generation (starts at 1st of month)
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

                const newBooks = parseInt(monthlyBookRows.find(r => r.month === monthStr)?.count) || 0;
                const joins = parseInt(monthlyJoinRows.find(r => r.month === monthStr)?.count) || 0;
                const downloads = parseInt(monthlyDownloadRows.find(r => r.month === monthStr)?.count) || 0;
                const views = parseInt(monthlyViewRows.find(r => r.month === monthStr)?.count) || 0;

                monthlyTrends.push({
                    month: monthStr,
                    new_books: newBooks,
                    joins,
                    downloads,
                    views,
                });
            }

            // 4. Merged Daily Trends (last 30 days)
            const dailyTrends = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                const joins = parseInt(dailyJoinRows.find(r => r.date === dateStr)?.count) || 0;
                const downloads = parseInt(dailyDownloadRows.find(r => r.date === dateStr)?.count) || 0;
                const views = parseInt(dailyViewRows.find(r => r.date === dateStr)?.count) || 0;

                dailyTrends.push({
                    date: dateStr,
                    joins,
                    downloads,
                    views,
                });
            }

            // 5. Merged Yearly Trends (last 5 years)
            const yearlyTrends = [];
            const yearJoinMap = {};
            const yearDownloadMap = {};
            for (const r of yearlyJoinRows) yearJoinMap[r.year] = parseInt(r.count) || 0;
            for (const r of yearlyDownloadRows) yearDownloadMap[r.year] = parseInt(r.count) || 0;

            for (let i = 4; i >= 0; i--) {
                const year = currentYear - i;
                yearlyTrends.push({
                    year,
                    new_books: yearMap[year] || 0,
                    joins: yearJoinMap[year] || 0,
                    downloads: yearDownloadMap[year] || 0,
                });
            }

            // 6. Category distribution + views
            const sortedByCnt = [...catViewRows]
                .sort((a, b) => (parseInt(b.book_count) || 0) - (parseInt(a.book_count) || 0));
            let categoryDistribution = sortedByCnt.map(r => ({
                name: r.Category?.name || r['Category.name'] || 'Unknown',
                value: parseInt(r.book_count) || 0,
            }));
            if (categoryDistribution.length === 0) {
                categoryDistribution = [{ name: "General", value: totalBooks }];
            }

            const top5ByViews = [...catViewRows]
                .sort((a, b) => (parseInt(b.total_views) || 0) - (parseInt(a.total_views) || 0))
                .slice(0, 5);
            const categoryViews = top5ByViews.map(r => ({
                name: r.Category?.name || r['Category.name'] || 'Unknown',
                views: parseInt(r.total_views) || 0,
                books: parseInt(r.book_count) || 0,
            }));

            // 7. Recent activities
            const recentActivities = activities.map(act => {
                const fullName = act.User
                    ? (`${act.User.firstName || ''} ${act.User.lastName || ''}`).trim() || act.User.username
                    : "System";
                return {
                    id: act.id,
                    action: act.action,
                    target_name: act.targetName,
                    created_at: act.createdAt,
                    type: act.targetType,
                    user: { eng_name: fullName, kh_name: fullName },
                    user_role: act.User?.Roles?.[0]?.name || "user",
                };
            });

            // 8. Role activity stats
            const roleMap = {};
            for (const row of roleRows) {
                const roleName = row.roleName || 'Unknown';

                if (!roleMap[roleName]) roleMap[roleName] = { create_count: 0, update_count: 0, delete_count: 0 };
                const cnt = parseInt(row.count) || 0;
                if (row.action === 'created') roleMap[roleName].create_count += cnt;
                else if (row.action === 'updated') roleMap[roleName].update_count += cnt;
                else if (row.action === 'deleted') roleMap[roleName].delete_count += cnt;
            }
            const roleActivityStats = Object.entries(roleMap)
                .filter(([, v]) => v.create_count > 0 || v.update_count > 0 || v.delete_count > 0)
                .map(([name, counts]) => ({
                    user_role: name.charAt(0).toUpperCase() + name.slice(1),
                    ...counts,
                }));

            const payload = {
                total_books: totalBooks,
                total_theses: typeCounts.theses,
                total_members: totalMembers,
                total_active_members: totalActiveMembers,
                total_journals: typeCounts.journals,
                total_authors: totalAuthors,
                total_categories: totalCategories,
                total_downloads: totalDownloads,
                total_articles: typeCounts.articles,
                upload_stats: uploadStats,
                category_stats: categoryDistribution,
                category_views: categoryViews,
                monthly_reading_stats: monthlyTrends, // Unified trend report
                daily_trends: dailyTrends,           // New: Daily stats
                yearly_trends: yearlyTrends,         // New: Yearly stats
                role_activity_stats: roleActivityStats,
                recent_activities: recentActivities,
                total_activities: totalCount || 0,
                _key: cacheKey,
            };

            // Cache the result
            _overviewCache = payload;
            _overviewCacheTime = Date.now();

            return ResponseFormatter.success(res, payload);
        } catch (error) {
            next(error);
        }
    }

    static async getPublicStats(req, res, next) {
        try {
            const [totalBooks, totalMembers, totalCategories] = await Promise.all([
                Book.count({ where: { isDeleted: false } }).catch(() => 0),
                User.count({ where: { isDeleted: false } }).catch(() => 0),
                Category.count().catch(() => 0),
            ]);
            return ResponseFormatter.success(res, {
                total_books: totalBooks,
                total_members: totalMembers,
                total_categories: totalCategories,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getPopular(req, res, next) {
        try {
            const { limit = 10 } = req.query;
            const popularBooks = await Book.findAll({
                where: { isDeleted: false },
                include: [
                    { model: Category, as: 'Category', attributes: ['id', 'name'] },
                    { model: Author, as: 'Authors', attributes: ['id', 'name'], through: { attributes: [] } },
                ],
                attributes: {
                    include: [
                        [literal('(SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.book_id = "Book".id AND r.is_deleted = false)'), 'averageRating'],
                        [literal('(SELECT COUNT(*) FROM reviews r WHERE r.book_id = "Book".id AND r.is_deleted = false)'), 'reviewCount'],
                    ],
                },
                order: [["views", "DESC"]],
                limit: parseInt(limit),
                distinct: true,
                subQuery: false,
            });
            return ResponseFormatter.success(res, { popularBooks });
        } catch (error) {
            next(error);
        }
    }

    static async getRecent(req, res, next) {
        try {
            const { limit = 10 } = req.query;
            const recentBooks = await Book.findAll({
                where: { isDeleted: false },
                include: [
                    { model: Category, as: 'Category', attributes: ['id', 'name'] },
                    { model: Author, as: 'Authors', attributes: ['id', 'name'], through: { attributes: [] } },
                ],
                attributes: {
                    include: [
                        [literal('(SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.book_id = "Book".id AND r.is_deleted = false)'), 'averageRating'],
                        [literal('(SELECT COUNT(*) FROM reviews r WHERE r.book_id = "Book".id AND r.is_deleted = false)'), 'reviewCount'],
                    ],
                },
                order: [["created_at", "DESC"]],
                limit: parseInt(limit),
                distinct: true,
                subQuery: false,
            });
            return ResponseFormatter.success(res, { recentBooks });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = StatsController;
