const { Activity, User, Role } = require("../models");
const { Op } = require("sequelize");
const ResponseFormatter = require("../utils/responseFormatter");

class ActivityController {
    /**
     * Get paginated and filtered activity logs
     */
    static async getActivities(req, res, next) {
        try {
            const pageNum = Math.max(1, parseInt(req.query.page) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
            const offset = (pageNum - 1) * limitNum;
            const type = req.query.type || 'all';
            const search = req.query.search || '';
            const userId = req.query.userId || null;
            const days = req.query.days || null;

            // Build where clause
            const where = {};

            if (type !== 'all') {
                where.targetType = type;
            }

            if (userId) {
                where.userId = userId;
            }

            if (days && days !== 'all') {
                const daysInt = parseInt(days);
                if (!isNaN(daysInt)) {
                    const dateLimit = new Date();
                    if (daysInt === 1) {
                        dateLimit.setHours(0, 0, 0, 0);
                    } else {
                        dateLimit.setDate(dateLimit.getDate() - daysInt);
                    }
                    where.createdAt = {
                        [Op.gte]: dateLimit
                    };
                }
            }

            if (search) {
                where[Op.or] = [
                    { action: { [Op.iLike]: `%${search}%` } },
                    { targetName: { [Op.iLike]: `%${search}%` } },
                    { '$User.firstName$': { [Op.iLike]: `%${search}%` } },
                    { '$User.lastName$': { [Op.iLike]: `%${search}%` } },
                    { '$User.username$': { [Op.iLike]: `%${search}%` } },
                ];
            }

            const userInclude = {
                model: User,
                as: 'User',
                attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
                include: [{ model: Role, as: 'Roles', attributes: ['name'] }],
                required: false,
            };

            // Two-query approach: accurate count + paginated rows (avoids inflation from JOINs)
            const [count, rows] = await Promise.all([
                Activity.count({ where, include: [{ ...userInclude, required: !!search }] }),
                Activity.findAll({
                    where,
                    include: [userInclude],
                    order: [['createdAt', 'DESC']],
                    limit: limitNum,
                    offset,
                    subQuery: false,
                }),
            ]);

            const activities = rows.map(act => {
                const fullName = act.User ?
                    (`${act.User.firstName} ${act.User.lastName}`).trim() || act.User.username :
                    "System";

                return {
                    id: String(act.id),
                    user: {
                        name: fullName,
                        email: act.User?.email,
                        initials: (act.User?.firstName && act.User?.lastName)
                            ? (act.User.firstName[0] + act.User.lastName[0]).toUpperCase()
                            : (act.User?.username?.substring(0, 2).toUpperCase() || "SY"),
                        role: act.User?.Roles?.[0]?.name || "user"
                    },
                    action: act.action,
                    target: act.targetName,
                    type: act.targetType,
                    metadata: act.metadata,
                    timestamp: act.createdAt
                };
            });

            return ResponseFormatter.success(res, {
                activities,
                pagination: {
                    total: count,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(count / limitNum),
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ActivityController;
