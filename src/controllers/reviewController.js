// controllers/reviewController.js
const { Op, fn, col } = require('sequelize');
const { Review, User, Book } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { NotFoundError, ConflictError, AuthorizationError } = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');
const { EVENTS, emitToAdmin, emitBroadcast } = require('../utils/socket');
const { reviewCache } = require('../utils/reviewCache');

/** Compute avg rating for a book — cached for 2 min */
async function getBookAvgRating(bookId) {
  const cached = reviewCache.get('avg', bookId);
  if (cached !== null) return cached;

  const result = await Review.findOne({
    where: { bookId, isDeleted: false },
    attributes: [[fn('AVG', col('rating')), 'avgRating']],
    raw: true,
  });
  const avg = result?.avgRating ? Number(Number(result.avgRating).toFixed(1)) : null;

  reviewCache.set('avg', bookId, avg);
  return avg;
}

/** Compute review count for a book — cached for 2 min */
async function getBookReviewCount(bookId) {
  const cached = reviewCache.get('count', bookId);
  if (cached !== null) return cached;

  const count = await Review.count({ where: { bookId, isDeleted: false } });
  reviewCache.set('count', bookId, count);
  return count;
}

/** Build a rich notification payload for review events */
function buildReviewPayload(review, book, user) {
  return {
    review: {
      id:        review.id,
      bookId:    review.bookId,
      userId:    review.userId,
      rating:    review.rating,
      comment:   review.comment,
      createdAt: review.created_at || review.createdAt,
    },
    bookId:    book?.id ?? review.bookId,
    bookTitle: book?.title ?? 'Unknown',
    bookCover: book?.coverUrl ?? null,
    userName:  user ? `${user.firstName } ${user.lastName }`.trim() || user.username : 'A member',
    userAvatar: user?.avatar ?? null,
    averageRating: null, // filled async below
    totalReviews:  null,
  };
}

/** Invalidate all caches for a book after a review change */
function invalidateBookReviewCache(bookId) {
  reviewCache.invalidate('avg', bookId);
  reviewCache.invalidate('count', bookId);
  reviewCache.invalidate('reviews', bookId);
}

// ─────────────────────────────────────────────────────────────────────────────

class ReviewController {

  // ── GET /api/books/:bookId/reviews ──────────────────────────────────────────
  static async getByBook(req, res, next) {
    try {
      const { bookId } = req.params;
      const page   = Math.max(1, Number(req.query.page)  || 1);
      const limit  = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const book = await Book.findOne({ where: { id: bookId, isDeleted: false } });
      if (!book) return ResponseFormatter.notFound(res, 'Book not found');

      // Parallel: fetch reviews + avg rating (cached)
      const [{ count, rows }, avgRating] = await Promise.all([
        Review.findAndCountAll({
          where: { bookId, isDeleted: false },
          include: [{
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'username', 'avatar'],
          }],
          order: [['created_at', 'DESC']],
          limit,
          offset,
        }),
        getBookAvgRating(bookId),
      ]);

      return ResponseFormatter.success(res, {
        reviews:       rows,
        averageRating: avgRating,
        totalReviews:  count,
        totalPages:    Math.ceil(count / limit),
        currentPage:   page,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── POST /api/books/:bookId/reviews ─────────────────────────────────────────
  static async create(req, res, next) {
    try {
      const { bookId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return ResponseFormatter.error(res, 'Rating must be between 1 and 5', 400);
      }

      const book = await Book.findOne({ where: { id: bookId, isDeleted: false } });
      if (!book) return ResponseFormatter.notFound(res, 'Book not found');

      // One review per user per book
      const existing = await Review.findOne({ where: { bookId, userId, isDeleted: false } });
      if (existing) throw new ConflictError('You have already reviewed this book');

      const review = await Review.create({ bookId, userId, rating, comment });

      // Re-fetch with user info
      const full = await Review.findByPk(review.id, {
        include: [{ model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'username', 'avatar'] }],
      });

      // Invalidate cache so next read gets fresh data
      invalidateBookReviewCache(bookId);

      // Activity log (fire-and-forget)
      logActivity({
        userId,
        action: 'created',
        targetType: 'review',
        targetId: review.id,
        targetName: book.title,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }).catch(() => {});

      // Build rich notification payload with fresh stats
      const [avgRating, totalReviews] = await Promise.all([
        getBookAvgRating(bookId),
        getBookReviewCount(bookId),
      ]);

      const payload = buildReviewPayload(full, book, full?.User);
      payload.averageRating = avgRating;
      payload.totalReviews  = totalReviews;

      // Broadcast to admin + public (no duplication)
      emitBroadcast(EVENTS.REVIEW_CREATED, payload);

      return ResponseFormatter.success(res, full, 'Review submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // ── PUT /api/reviews/:id ─────────────────────────────────────────────────────
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      if (rating !== undefined && (rating < 1 || rating > 5)) {
        return ResponseFormatter.error(res, 'Rating must be between 1 and 5', 400);
      }

      const review = await Review.findOne({ where: { id, isDeleted: false } });
      if (!review) return ResponseFormatter.notFound(res, 'Review not found');

      // Only the author OR admin/librarian may edit
      const isAdmin = req.user.Roles?.some((r) => ['admin', 'librarian'].includes(r.name));
      if (review.userId !== userId && !isAdmin) {
        throw new AuthorizationError('You can only edit your own reviews');
      }

      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      await review.save();

      // Invalidate cache
      invalidateBookReviewCache(review.bookId);

      const full = await Review.findByPk(review.id, {
        include: [
          { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'username', 'avatar'] },
          { model: Book, as: 'Book', attributes: ['id', 'title', 'coverUrl'] },
        ],
      });

      // Compute fresh stats
      const [avgRating, totalReviews] = await Promise.all([
        getBookAvgRating(review.bookId),
        getBookReviewCount(review.bookId),
      ]);

      const payload = buildReviewPayload(full, full?.Book, full?.User);
      payload.averageRating = avgRating;
      payload.totalReviews  = totalReviews;

      emitToAdmin(EVENTS.REVIEW_UPDATED, payload);

      return ResponseFormatter.success(res, full, 'Review updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ── DELETE /api/reviews/:id ──────────────────────────────────────────────────
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const review = await Review.findOne({
        where: { id, isDeleted: false },
        include: [{ model: Book, as: 'Book', attributes: ['id', 'title'] }],
      });
      if (!review) return ResponseFormatter.notFound(res, 'Review not found');

      const isAdmin = req.user.Roles?.some((r) => ['admin', 'librarian'].includes(r.name));
      if (review.userId !== userId && !isAdmin) {
        throw new AuthorizationError('You can only delete your own reviews');
      }

      const bookId = review.bookId;
      review.isDeleted = true;
      await review.save();

      // Invalidate cache
      invalidateBookReviewCache(bookId);

      // Activity log (fire-and-forget)
      logActivity({
        userId,
        action: 'deleted',
        targetType: 'review',
        targetId: review.id,
        targetName: `Review #${review.id}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }).catch(() => {});

      // Emit with book context so dashboard can refresh
      emitToAdmin(EVENTS.REVIEW_DELETED, {
        reviewId:  review.id,
        bookId,
        bookTitle: review.Book?.title ?? 'Unknown',
      });

      return ResponseFormatter.success(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/reviews/my ─────────────────────────────────────────────────────
  static async getMyReviews(req, res, next) {
    try {
      const userId = req.user.id;
      const page   = Math.max(1, Number(req.query.page)  || 1);
      const limit  = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const { count, rows } = await Review.findAndCountAll({
        where: { userId, isDeleted: false },
        include: [
          { model: Book, as: 'Book', attributes: ['id', 'title', 'titleKh', 'coverUrl'] },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return ResponseFormatter.success(res, {
        reviews:     rows,
        total:       count,
        totalPages:  Math.ceil(count / limit),
        currentPage: page,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/reviews/stats  (admin) ─────────────────────────────────────────
  // Single query: GROUP BY rating gives us count-per-rating AND avg in one round-trip
  static async getStats(req, res, next) {
    try {
      const ratingRows = await Review.findAll({
        where: { isDeleted: false },
        attributes: [
          'rating',
          [fn('COUNT', col('id')), 'count'],
        ],
        group: ['rating'],
        raw: true,
      });

      const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;
      let weightedSum = 0;
      for (const row of ratingRows) {
        const cnt = Number(row.count);
        byRating[row.rating] = cnt;
        total += cnt;
        weightedSum += row.rating * cnt;
      }
      const averageRating = total > 0 ? Number((weightedSum / total).toFixed(1)) : null;

      return ResponseFormatter.success(res, { total, byRating, averageRating });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/reviews  (admin — all reviews with filters) ────────────────────
  // ── GET /api/reviews/public (no auth — homepage testimonials) ──────────────
  static async getPublic(req, res, next) {
    try {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

      const rows = await Review.findAll({
        where: { isDeleted: false },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'username', 'avatar'],
          },
          {
            model: Book,
            as: 'Book',
            attributes: ['id', 'title'],
            where: { isDeleted: false },
            required: true,
          },
        ],
        order: [
          ['rating', 'DESC'],
          ['created_at', 'DESC'],
        ],
        limit,
      });

      return ResponseFormatter.success(res, rows);
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/reviews (admin) ───────────────────────────────────────────────
  static async getAll(req, res, next) {
    try {
      const page   = Math.max(1, Number(req.query.page)  || 1);
      const limit  = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const where = { isDeleted: false };
      if (req.query.bookId)  where.bookId = req.query.bookId;
      if (req.query.userId)  where.userId = req.query.userId;
      if (req.query.rating)  where.rating = Number(req.query.rating);

      const search = req.query.search?.trim();

      // Build include — always fetch full User/Book data, no WHERE on includes
      // (search filtering is handled via searchWhere on the main query below)
      const bookInclude = {
        model: Book,
        as: 'Book',
        attributes: ['id', 'title', 'titleKh', 'coverUrl'],
      };
      const userInclude = {
        model: User,
        as: 'User',
        attributes: ['id', 'firstName', 'lastName', 'username', 'avatar'],
      };

      // When searching, include rows that match EITHER the book title OR the username
      let queryOptions = {
        where,
        include: [userInclude, bookInclude],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        distinct: true,
      };

      if (search) {
        // We need to join and filter: keep rows where Book title OR User username matches
        // Use subquery approach: fetch all matching IDs first
        const bookIds   = (await Book.findAll({ where: { title: { [Op.iLike]: `%${search}%` } }, attributes: ['id'], raw: true })).map((b) => b.id);
        const userIds   = (await User.findAll({
          where: {
            [Op.or]: [
              { username:  { [Op.iLike]: `%${search}%` } },
              { firstName: { [Op.iLike]: `%${search}%` } },
              { lastName:  { [Op.iLike]: `%${search}%` } },
            ],
          },
          attributes: ['id'],
          raw: true,
        })).map((u) => u.id);

        const searchWhere = {
          ...where,
          [Op.or]: [
            ...(bookIds.length ? [{ bookId: { [Op.in]: bookIds } }] : []),
            ...(userIds.length ? [{ userId: { [Op.in]: userIds } }] : []),
          ],
        };

        if (!bookIds.length && !userIds.length) {
          return ResponseFormatter.success(res, { reviews: [], total: 0, totalPages: 0, currentPage: page });
        }

        queryOptions = { ...queryOptions, where: searchWhere };
      }

      const { count, rows } = await Review.findAndCountAll(queryOptions);

      return ResponseFormatter.success(res, {
        reviews:     rows,
        total:       count,
        totalPages:  Math.ceil(count / limit),
        currentPage: page,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;
