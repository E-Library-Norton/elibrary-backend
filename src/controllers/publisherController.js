// controllers/publisher.controller.js
const { Op, UniqueConstraintError } = require('sequelize');
const { Publisher } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');

class PublisherController {

  // GET /api/publishers
  static async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const where = search
        ? { [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { nameKh: { [Op.iLike]: `%${search}%` } }] }
        : {};
      const { count, rows } = await Publisher.findAndCountAll({
        where, order: [['name', 'ASC']],
        limit: Number(limit), offset: (Number(page) - 1) * Number(limit),
      });
      return ResponseFormatter.success(res, {
        publishers: rows, total: count, page: Number(page),
        limit: Number(limit), totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (err) { next(err); }
  }

  // GET /api/publishers/:id
  static async getById(req, res, next) {
    try {
      const publisher = await Publisher.findByPk(req.params.id);
      if (!publisher) throw new NotFoundError('Publisher not found');
      return ResponseFormatter.success(res, publisher);
    } catch (err) { next(err); }
  }

  // POST /api/publishers
  static async create(req, res, next) {
    try {
      const { name, nameKh, address, contactEmail } = req.body;
      if (!name) throw new ValidationError('Name is required');
      const existing = await Publisher.findOne({ where: { name: name.trim() } });
      if (existing) throw new ConflictError(`Publisher "${name.trim()}" already exists`);
      const publisher = await Publisher.create({ name: name.trim(), nameKh, address, contactEmail });

      await logActivity({
        userId: req.user?.id || null,
        action: "created",
        targetType: "publisher",
        targetId: publisher.id,
        targetName: publisher.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.success(res, publisher, 'Publisher created successfully', 201);
    } catch (err) { next(err); }
  }

  // PUT /api/publishers/:id
  static async update(req, res, next) {
    try {
      const publisher = await Publisher.findByPk(req.params.id);
      if (!publisher) throw new NotFoundError('Publisher not found');
      const { name, nameKh, address, contactEmail } = req.body;
      if (name !== undefined) {
        const existing = await Publisher.findOne({ where: { name: name.trim(), id: { [Op.ne]: req.params.id } } });
        if (existing) throw new ConflictError(`Publisher "${name.trim()}" already exists`);
      }
      await publisher.update({
        ...(name !== undefined && { name }),
        ...(nameKh !== undefined && { nameKh }),
        ...(address !== undefined && { address }),
        ...(contactEmail !== undefined && { contactEmail }),
      });

      await logActivity({
        userId: req.user?.id || null,
        action: "updated",
        targetType: "publisher",
        targetId: publisher.id,
        targetName: publisher.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.success(res, publisher, 'Publisher updated successfully');
    } catch (err) { next(err); }
  }

  // DELETE /api/publishers/:id
  static async delete(req, res, next) {
    try {
      const publisher = await Publisher.findByPk(req.params.id);
      if (!publisher) throw new NotFoundError('Publisher not found');
      await publisher.destroy();

      await logActivity({
        userId: req.user?.id || null,
        action: "deleted",
        targetType: "publisher",
        targetId: publisher.id,
        targetName: publisher.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.noContent(res, null, 'Publisher deleted successfully');
    } catch (err) { next(err); }
  }
}

module.exports = PublisherController;