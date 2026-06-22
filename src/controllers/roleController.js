// src/controllers/roleController.js
const { Role, Permission } = require("../models");
const ResponseFormatter = require("../utils/responseFormatter");
const { NotFoundError, ConflictError } = require("../utils/errors");
const { logActivity } = require("../utils/activityLogger");

class RoleController {

  // ── GET /api/roles 
  static async getAll(req, res, next) {
    try {
      const roles = await Role.findAll({
        include: [{ association: "Permissions", through: { attributes: [] } }],
        order: [["name", "ASC"]],
      });
      return ResponseFormatter.success(res, roles);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/roles/:id 
  static async getById(req, res, next) {
    try {
      const role = await Role.findByPk(req.params.id, {
        include: [{ association: "Permissions", through: { attributes: [] } }],
      });
      if (!role) throw new NotFoundError("Role not found");
      return ResponseFormatter.success(res, role);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /api/roles 
  static async create(req, res, next) {
    try {
      const { name, description, permissionIds = [] } = req.body;

      const existing = await Role.findOne({ where: { name } });
      if (existing) throw new ConflictError(`Role '${name}' already exists`);

      const role = await Role.create({ name, description });

      // Assign permissions if provided
      if (permissionIds.length > 0) {
        const permissions = await Permission.findAll({ where: { id: permissionIds } });
        await role.setPermissions(permissions);
      }

      await logActivity({
        userId: req.user.id,
        action: "created",
        targetType: "role",
        targetId: role.id,
        targetName: role.name,
        details: { permissionIds },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      // Return role with its permissions
      const created = await Role.findByPk(role.id, {
        include: [{ association: "Permissions", through: { attributes: [] } }],
      });

      return ResponseFormatter.success(res, created, "Role created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /api/roles/:id 
  static async update(req, res, next) {
    try {
      const role = await Role.findByPk(req.params.id);
      if (!role) throw new NotFoundError("Role not found");

      const { name, description } = req.body;

      if (name && name !== role.name) {
        const existing = await Role.findOne({ where: { name } });
        if (existing) throw new ConflictError(`Role name '${name}' is already taken`);
      }

      await role.update({ name, description });

      await logActivity({
        userId: req.user.id,
        action: "updated",
        targetType: "role",
        targetId: role.id,
        targetName: role.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return ResponseFormatter.success(res, role, "Role updated successfully");
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /api/roles/:id 
  static async delete(req, res, next) {
    try {
      const role = await Role.findByPk(req.params.id);
      if (!role) throw new NotFoundError("Role not found");

      await role.destroy();

      await logActivity({
        userId: req.user.id,
        action: "deleted",
        targetType: "role",
        targetId: role.id,
        targetName: role.name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return ResponseFormatter.noContent(res, null, "Role deleted successfully");
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /api/roles/:id/permissions 
  // Full sync — replaces all permissions on this role with the given list
  static async assignRolePermissions(req, res, next) {
    try {
      const role = await Role.findByPk(req.params.id, {
        include: [{ association: "Permissions", through: { attributes: [] } }],
      });
      if (!role) throw new NotFoundError("Role not found");

      const { permissionIds = [] } = req.body;

      const permissions = permissionIds.length
        ? await Permission.findAll({ where: { id: permissionIds } })
        : [];

      await role.setPermissions(permissions);

      await logActivity({
        userId: req.user.id,
        action: "updated",
        targetType: "role",
        targetId: role.id,
        targetName: role.name,
        details: { permissionIds },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      // Return role with updated permissions
      const updated = await Role.findByPk(role.id, {
        include: [{ association: "Permissions", through: { attributes: [] } }],
      });
      return ResponseFormatter.success(res, updated, "Permissions assigned to role successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RoleController;