// controllers/editorController.js
const { Op, UniqueConstraintError } = require('sequelize');
const { Editor, Book } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');

class EditorController {

  // GET /api/editors
  static async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const where = search
        ? { [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { nameKh: { [Op.iLike]: `%${search}%` } }] }
        : {};

      const { count, rows } = await Editor.findAndCountAll({
        where, order: [['name', 'ASC']],
        limit: Number(limit), offset: (Number(page) - 1) * Number(limit),
      });
      return ResponseFormatter.success(res, {
        editors: rows, total: count, page: Number(page),
        limit: Number(limit), totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (err) { next(err); }
  }

  // GET /api/editors/:id
  static async getById(req, res, next) {
    try {
      const editor = await Editor.findByPk(req.params.id, {
        include: [{ model: Book, as: 'Books', attributes: ['id', 'title', 'coverUrl', 'publicationYear'] }],
      });
      if (!editor) throw new NotFoundError('Editor not found');
      return ResponseFormatter.success(res, editor);
    } catch (err) { next(err); }
  }

  // POST /api/editors
  static async create(req, res, next) {
    try {
      const { name, nameKh, biography, website } = req.body;
      if (!name) throw new ValidationError('Name is required');
      const existing = await Editor.findOne({ where: { name: name.trim() } });
      if (existing) throw new ConflictError(`Editor "${name.trim()}" already exists`);
      const editor = await Editor.create({ name: name.trim(), nameKh, biography, website });

      await logActivity({
        userId: req.user.id,
        action: 'created',
        targetType: 'editor',
        targetId: editor.id,
        targetName: editor.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return ResponseFormatter.success(res, editor, 'Editor created successfully', 201);
    } catch (err) { next(err); }
  }

  // PUT /api/editors/:id
  static async update(req, res, next) {
    try {
      const editor = await Editor.findByPk(req.params.id);
      if (!editor) throw new NotFoundError('Editor not found');
      const { name, nameKh, biography, website } = req.body;
      if (name !== undefined) {
        const existing = await Editor.findOne({ where: { name: name.trim(), id: { [Op.ne]: req.params.id } } });
        if (existing) throw new ConflictError(`Editor "${name.trim()}" already exists`);
      }
      await editor.update({
        ...(name !== undefined && { name: name.trim() }),
        ...(nameKh !== undefined && { nameKh }),
        ...(biography !== undefined && { biography }),
        ...(website !== undefined && { website }),
      });

      await logActivity({
        userId: req.user.id,
        action: 'updated',
        targetType: 'editor',
        targetId: editor.id,
        targetName: editor.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return ResponseFormatter.success(res, editor, 'Editor updated successfully');
    } catch (err) { next(err); }
  }

  // DELETE /api/editors/:id
  static async delete(req, res, next) {
    try {
      const editor = await Editor.findByPk(req.params.id);
      if (!editor) throw new NotFoundError('Editor not found');
      await editor.destroy();

      await logActivity({
        userId: req.user.id,
        action: 'deleted',
        targetType: 'editor',
        targetId: editor.id,
        targetName: editor.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return ResponseFormatter.noContent(res, null, 'Editor deleted successfully');
    } catch (err) { next(err); }
  }
}

module.exports = EditorController;
