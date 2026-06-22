// controllers/materialType.controller.js
const { Op } = require('sequelize');
const { MaterialType } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');

class MaterialTypeController {
  static async getAll(req, res, next) {
    try {
      const types = await MaterialType.findAll({ order: [['name', 'ASC']] });
      return ResponseFormatter.success(res, types);
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const type = await MaterialType.findByPk(req.params.id);
      if (!type) throw new NotFoundError('Material type not found');
      return ResponseFormatter.success(res, type);
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const { name, nameKh, description } = req.body;
      if (!name) throw new ValidationError('Name is required');
      const type = await MaterialType.create({ name, nameKh, description });

      await logActivity({
        userId: req.user.id,
        action: "created",
        targetType: "material_type",
        targetId: type.id,
        targetName: type.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.success(res, type, 'Material type created successfully', 201);
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      const type = await MaterialType.findByPk(req.params.id);
      if (!type) throw new NotFoundError('Material type not found');
      const { name, nameKh, description } = req.body;
      await type.update({
        ...(name !== undefined && { name }),
        ...(nameKh !== undefined && { nameKh }),
        ...(description !== undefined && { description }),
      });

      await logActivity({
        userId: req.user.id,
        action: "updated",
        targetType: "material_type",
        targetId: type.id,
        targetName: type.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.success(res, type, 'Material type updated successfully');
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      const type = await MaterialType.findByPk(req.params.id);
      if (!type) throw new NotFoundError('Material type not found');
      await type.destroy();

      await logActivity({
        userId: req.user.id,
        action: "deleted",
        targetType: "material_type",
        targetId: type.id,
        targetName: type.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.noContent(res, null, 'Material type deleted successfully');
    } catch (err) { next(err); }
  }
}

module.exports = MaterialTypeController;