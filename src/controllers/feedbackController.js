// controllers/feedbackController.js
const { Op, fn, col } = require('sequelize');
const { Feedback, User } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { logActivity } = require('../utils/activityLogger');
const { EVENTS, emitToAdmin } = require('../utils/socket');


class FeedbackController {
  // ── POST /api/feedback 
  // Public (optionalAuth) — logged-in user auto-fills name/email from profile
  static async create(req, res, next) {
    try {
      const { type, subject, message, name, email, rating } = req.body;

      if (!subject?.trim() || !message?.trim()) {
        return ResponseFormatter.error(res, 'Subject and message are required', 400, 'BAD_REQUEST');
      }

      // If user is logged in, link feedback to their account
      const userId = req.user?.id ?? null;
      const feedbackName = req.user
        ? `${req.user.firstName} ${req.user.lastName}`.trim() || req.user.username
        : name?.trim() || 'Anonymous';
      const feedbackEmail = req.user?.email || email?.trim() || null;

      const feedback = await Feedback.create({
        userId,
        type: type || 'general',
        subject: subject.trim(),
        message: message.trim(),
        name: feedbackName,
        email: feedbackEmail,
        rating: rating ? Math.min(5, Math.max(1, Number(rating))) : null,
        status: 'new',
      });

      // Real-time notification to admin dashboard
      emitToAdmin(EVENTS.FEEDBACK_NEW, {
        feedback: {
          id: feedback.id,
          type: feedback.type,
          subject: feedback.subject,
          name: feedbackName,
          rating: feedback.rating,
        },
      });

      // Activity log
      if (userId) {
        logActivity({
          userId,
          action: 'feedback_submitted',
          targetId: feedback.id,
          targetName: subject.trim(),
          targetType: 'feedback',
          metadata: { type: feedback.type },
        });
      }

      return ResponseFormatter.success(res, {
        id: feedback.id,
        type: feedback.type,
        subject: feedback.subject,
        status: feedback.status,
      }, 'Feedback submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/feedback/public — public testimonials 
  // No auth required — returns approved feedback with ratings for homepage
  static async getPublicTestimonials(req, res, next) {
    try {
      const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));

      const feedbacks = await Feedback.findAll({
        where: {
          rating: { [Op.gte]: 4 },          // only 4–5 star feedback
        },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'username', 'avatar'],
            required: false,
          },
        ],
        attributes: ['id', 'name', 'message', 'rating', 'type', 'created_at'],
        order: [['created_at', 'DESC']],
        limit,
      });

      const testimonials = feedbacks.map(f => {
        const plain = f.get({ plain: true });
        const user = plain.User;
        return {
          id: plain.id,
          name: user ? `${user.firstName} ${user.lastName}`.trim() || user.username : plain.name,
          avatar: user?.avatar || null,
          message: plain.message,
          rating: plain.rating,
          type: plain.type,
          createdAt: plain.created_at,
        };
      });

      return ResponseFormatter.success(res, testimonials, 'Public testimonials fetched');
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/feedback ─
  // Admin only — paginated list with filters
  static async getAll(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      // Build filter
      const where = {};
      if (req.query.status) where.status = req.query.status;
      if (req.query.type) where.type = req.query.type;
      if (req.query.search) {
        where[Op.or] = [
          { subject: { [Op.iLike]: `%${req.query.search}%` } },
          { message: { [Op.iLike]: `%${req.query.search}%` } },
          { name: { [Op.iLike]: `%${req.query.search}%` } },
          { email: { [Op.iLike]: `%${req.query.search}%` } },
        ];
      }

      const { count, rows } = await Feedback.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'username', 'avatar', 'email'],
            required: false,
          },
          {
            model: User,
            as: 'Resolver',
            attributes: ['id', 'firstName', 'lastName', 'username'],
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return ResponseFormatter.success(res, {
        feedbacks: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/feedback/stats 
  // Admin — feedback summary stats
  static async getStats(req, res, next) {
    try {
      const [total, byStatus, byType] = await Promise.all([
        Feedback.count(),
        Feedback.findAll({
          attributes: ['status', [fn('COUNT', col('id')), 'count']],
          group: ['status'],
          raw: true,
        }),
        Feedback.findAll({
          attributes: ['type', [fn('COUNT', col('id')), 'count']],
          group: ['type'],
          raw: true,
        }),
      ]);

      return ResponseFormatter.success(res, {
        total,
        byStatus: Object.fromEntries(byStatus.map(r => [r.status, Number(r.count)])),
        byType: Object.fromEntries(byType.map(r => [r.type, Number(r.count)])),
      });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/feedback/:id ──
  // Admin — single feedback detail
  static async getById(req, res, next) {
    try {
      const feedback = await Feedback.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'username', 'avatar', 'email'],
            required: false,
          },
          {
            model: User,
            as: 'Resolver',
            attributes: ['id', 'firstName', 'lastName', 'username'],
            required: false,
          },
        ],
      });

      if (!feedback) return ResponseFormatter.notFound(res, 'Feedback not found');
      return ResponseFormatter.success(res, feedback);
    } catch (error) {
      next(error);
    }
  }

  // ── PATCH /api/feedback/:id 
  // Admin — update status, add notes
  static async update(req, res, next) {
    try {
      const feedback = await Feedback.findByPk(req.params.id);
      if (!feedback) return ResponseFormatter.notFound(res, 'Feedback not found');

      const { status, adminNotes } = req.body;
      const updates = {};

      if (status) {
        updates.status = status;
        // Auto-set resolvedBy/resolvedAt when marking resolved/closed
        if (['resolved', 'closed'].includes(status) && !feedback.resolvedBy) {
          updates.resolvedBy = req.user.id;
          updates.resolvedAt = new Date();
        }
      }
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;

      await feedback.update(updates);

      // Activity log
      logActivity({
        userId: req.user.id,
        action: 'feedback_updated',
        targetId: feedback.id,
        targetName: feedback.subject,
        targetType: 'feedback',
        metadata: { status: feedback.status },
      });

      return ResponseFormatter.success(res, feedback, 'Feedback updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ── DELETE /api/feedback/:id 
  // Admin only
  static async delete(req, res, next) {
    try {
      const feedback = await Feedback.findByPk(req.params.id);
      if (!feedback) return ResponseFormatter.notFound(res, 'Feedback not found');

      const subject = feedback.subject;
      await feedback.destroy();

      logActivity({
        userId: req.user.id,
        action: 'feedback_deleted',
        targetId: req.params.id,
        targetName: subject,
        targetType: 'feedback',
      });

      return ResponseFormatter.success(res, null, 'Feedback deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FeedbackController;
