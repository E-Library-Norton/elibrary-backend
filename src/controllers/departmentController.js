// controllers/department.controller.js
const { Op } = require('sequelize');
const { Department } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');

class DepartmentController {
  static async getAll(req, res, next) {
    try {
      const { search = '' } = req.query;
      const where = search
        ? { [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { code: { [Op.iLike]: `%${search}%` } }] }
        : {};
      const depts = await Department.findAll({ where, order: [['name', 'ASC']] });
      return ResponseFormatter.success(res, depts);
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const dept = await Department.findByPk(req.params.id);
      if (!dept) throw new NotFoundError('Department not found');
      return ResponseFormatter.success(res, dept);
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const { name, nameKh, code, description } = req.body;
      if (!name) throw new ValidationError('Name is required');
      if (code) {
        const exists = await Department.findOne({ where: { code } });
        if (exists) throw new ConflictError(`Department ${code} already exists`);
      }
      const dept = await Department.create({ name, nameKh, code, description });

      await logActivity({
        userId: req.user.id,
        action: "created",
        targetType: "department",
        targetId: dept.id,
        targetName: dept.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.success(res, dept, 'Department created successfully', 201);
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      const dept = await Department.findByPk(req.params.id);
      if (!dept) throw new NotFoundError('Department not found');
      const { name, nameKh, code, description } = req.body;
      if (code && code !== dept.code) {
        const exists = await Department.findOne({ where: { code } });
        if (exists) throw new ConflictError(`Department ${code} already exists`);
      }
      await dept.update({
        ...(name !== undefined && { name }),
        ...(nameKh !== undefined && { nameKh }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
      });

      await logActivity({
        userId: req.user.id,
        action: "updated",
        targetType: "department",
        targetId: dept.id,
        targetName: dept.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.success(res, dept, 'Department updated successfully');
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      const dept = await Department.findByPk(req.params.id);
      if (!dept) throw new NotFoundError('Department not found');
      await dept.destroy();

      await logActivity({
        userId: req.user.id,
        action: "deleted",
        targetType: "department",
        targetId: dept.id,
        targetName: dept.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });

      return ResponseFormatter.noContent(res, null, 'Department deleted successfully');
    } catch (err) { next(err); }
  }
}

module.exports = DepartmentController;