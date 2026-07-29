// controllers/author.controller.js
const { Op, fn, col } = require('sequelize');
const { Author, Book } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');

const ACTIVE_BOOK_WHERE = {
  isActive: true,
  isDeleted: false,
};

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`Invalid ${fieldName}`);
  }
  return parsed;
}

function parsePagination(query, defaultLimit) {
  const page = parsePositiveInteger(query.page ?? 1, 'page');
  const requestedLimit = parsePositiveInteger(
    query.limit ?? defaultLimit,
    'limit'
  );

  return {
    page,
    limit: Math.min(requestedLimit, 100),
  };
}

class AuthorController {

  // GET /api/authors
  static async getAll(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query, 20);
      const search = String(req.query.search ?? '').trim();
      const where = search
        ? { [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { nameKh: { [Op.iLike]: `%${search}%` } }] }
        : {};

      const [total, rows] = await Promise.all([
        Author.count({ where }),
        Author.findAll({
          where,
          attributes: {
            include: [
              [
                fn('COUNT', fn('DISTINCT', col('Books.id'))),
                'totalBooks',
              ],
            ],
          },
          include: [
            {
              model: Book,
              as: 'Books',
              attributes: [],
              through: { attributes: [] },
              where: ACTIVE_BOOK_WHERE,
              required: false,
            },
          ],
          group: ['Author.id'],
          order: [['name', 'ASC']],
          limit,
          offset: (page - 1) * limit,
          subQuery: false,
        }),
      ]);

      const authors = rows.map((author) => {
        const data = author.toJSON();
        return {
          ...data,
          totalBooks: Number(data.totalBooks) || 0,
        };
      });

      return ResponseFormatter.success(res, {
        authors,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      }, 'Authors retrieved successfully');
    } catch (err) { next(err); }
  }

  // GET /api/authors/:id
  static async getById(req, res, next) {
    try {
      const authorId = parsePositiveInteger(req.params.id, 'author ID');
      const { page, limit } = parsePagination(req.query, 12);
      const author = await Author.findByPk(authorId, {
        attributes: ['id', 'name', 'nameKh', 'biography', 'website'],
      });
      if (!author) throw new NotFoundError('Author not found');

      const [books, totalBooks] = await Promise.all([
        author.getBooks({
          where: ACTIVE_BOOK_WHERE,
          attributes: [
            'id',
            'title',
            'titleKh',
            'coverUrl',
            'publicationYear',
            'views',
            'downloads',
          ],
          through: { attributes: ['isPrimaryAuthor'] },
          order: [
            ['publicationYear', 'DESC NULLS LAST'],
            ['title', 'ASC'],
          ],
          limit,
          offset: (page - 1) * limit,
        }),
        author.countBooks({ where: ACTIVE_BOOK_WHERE }),
      ]);

      const data = {
        ...author.toJSON(),
        totalBooks,
        books: books.map((book) => {
          const plainBook = book.toJSON();
          return {
            id: plainBook.id,
            title: plainBook.title,
            titleKh: plainBook.titleKh,
            coverUrl: plainBook.coverUrl,
            publicationYear: plainBook.publicationYear,
            views: plainBook.views,
            downloads: plainBook.downloads,
            isPrimaryAuthor: Boolean(
              plainBook.BookAuthor?.isPrimaryAuthor
            ),
          };
        }),
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalBooks / limit)),
      };

      return ResponseFormatter.success(
        res,
        data,
        'Author details retrieved successfully'
      );
    } catch (err) { next(err); }
  }

  // POST /api/authors
  static async create(req, res, next) {
    try {
      const { name, nameKh, biography, website } = req.body;
      if (!name) throw new ValidationError('Name is required');
      const existing = await Author.findOne({ where: { name: name.trim() } });
      if (existing) throw new ConflictError(`Author "${name.trim()}" already exists`);
      const author = await Author.create({ name: name.trim(), nameKh, biography, website });

      await logActivity({
        userId: req.user.id,
        action: "created",
        targetType: "author",
        targetId: author.id,
        targetName: author.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.success(res, author, 'Author created successfully', 201);
    } catch (err) { next(err); }
  }

  // PUT /api/authors/:id
  static async update(req, res, next) {
    try {
      const author = await Author.findByPk(req.params.id);
      if (!author) throw new NotFoundError('Author not found');
      const { name, nameKh, biography, website } = req.body;
      if (name !== undefined) {
        const existing = await Author.findOne({ where: { name: name.trim(), id: { [Op.ne]: req.params.id } } });
        if (existing) throw new ConflictError(`Author "${name.trim()}" already exists`);
      }
      await author.update({ ...(name !== undefined && { name: name.trim() }), ...(nameKh !== undefined && { nameKh }), ...(biography !== undefined && { biography }), ...(website !== undefined && { website }) });

      await logActivity({
        userId: req.user.id,
        action: "updated",
        targetType: "author",
        targetId: author.id,
        targetName: author.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.success(res, author, 'Author updated successfully');
    } catch (err) { next(err); }
  }

  // DELETE /api/authors/:id
  static async delete(req, res, next) {
    try {
      const author = await Author.findByPk(req.params.id);
      if (!author) throw new NotFoundError('Author not found');
      await author.destroy();

      await logActivity({
        userId: req.user.id,
        action: "deleted",
        targetType: "author",
        targetId: author.id,
        targetName: author.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.noContent(res, null, 'Author deleted successfully');
    } catch (err) { next(err); }
  }
}

module.exports = AuthorController;
