// src/controllers/userController.js
const { Op } = require("sequelize");
const { User, Role, Permission } = require("../models");
const { invalidateUserCache } = require('../middleware/auth');
const ResponseFormatter = require("../utils/responseFormatter");
const Logger = require("../utils/logger");
const { PAGINATION } = require("../config/constants");
const { ValidationError, NotFoundError, ConflictError } = require("../utils/errors");
const { logActivity } = require("../utils/activityLogger");
const r2 = require('../config/r2');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { extractKeyFromUrl, uploadToR2 } = require('../utils/cloudR2Upload');

class UserController {

  // ── GET /api/users 
  static async getAll(req, res, next) {
    try {
      const page = Math.max(parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE, 1);
      const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
      const offset = (page - 1) * limit;
      const search = req.query.search;

      const where = { isDeleted: false };
      if (search) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { studentId: { [Op.iLike]: `%${search}%` } },
        ];
      }
      if (req.query.isActive !== undefined) {
        where.isActive = req.query.isActive === 'true';
      }

      // Count without JOIN to avoid row-inflation from multiple roles per user
      const count = await User.count({ where });

      // Fetch paginated users with roles
      const users = await User.findAll({
        where,
        include: [{ association: "Roles", through: { attributes: [] } }],
        limit,
        offset,
        order: [["created_at", "DESC"]],
      });

      return ResponseFormatter.success(res, {
        users,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/users/:id 
  static async getById(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [
          { association: "Roles", through: { attributes: [] } },
          { association: "Permissions", through: { attributes: [] } },
        ],
      });
      if (!user) throw new NotFoundError("User not found");

      const { roles, permissions } = await user.getRolesAndPermissions();
      return ResponseFormatter.success(res, { ...user.toJSON(), roles, permissions });
    } catch (err) {
      next(err);
    }
  }

  // ── POST /api/users  (admin creates a user directly) 
  static async create(req, res, next) {
    try {
      const { username, email, password, firstName, lastName, studentId, roleIds = [] } = req.body;
      const normalizedStudentId = studentId?.trim() || null;

      const takenUsername = await User.findOne({
        where: { username: { [Op.iLike]: username } },
      });
      if (takenUsername) throw new ConflictError("Username is already in use");

      if (normalizedStudentId) {
        const takenStudentId = await User.findOne({
          where: { studentId: normalizedStudentId },
        });
        if (takenStudentId) throw new ConflictError("Student ID is already in use");
      }

      const takenEmail = await User.findOne({
        where: { email: { [Op.iLike]: email } },
      });
      if (takenEmail) throw new ConflictError("Email is already in use");

      const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        studentId: normalizedStudentId,
      });

      if (roleIds.length > 0) {
        const roles = await Role.findAll({ where: { id: roleIds } });
        await user.setRoles(roles);
      } else {
        const defaultRole = await Role.findOne({ where: { name: "user" } });
        if (defaultRole) await user.addRole(defaultRole);
      }

      Logger.info(`Admin created user: ${username}`);

      await logActivity({
        userId: req.user.id,
        action: "created",
        targetType: "user",
        targetId: user.id,
        targetName: `${firstName} ${lastName}`.trim() || username,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      const created = await User.findByPk(user.id, {
        include: [{ association: "Roles", through: { attributes: [] } }],
      });

      return ResponseFormatter.success(res, created, "User created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  // ── PATCH /api/users/:id 
  static async update(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) throw new NotFoundError("User not found");

      const { avatar, username, firstName, lastName, studentId, email, isActive, roleIds } = req.body;
      const normalizedUsername = username ?? user.username;
      const normalizedEmail = email ?? user.email;
      const normalizedStudentId =
        studentId === undefined ? user.studentId : studentId?.trim() || null;

      const conflictingUser = await User.scope(null).findOne({
        where: {
          id: { [Op.ne]: user.id },
          [Op.or]: [
            { username: { [Op.iLike]: normalizedUsername } },
            { email: { [Op.iLike]: normalizedEmail } },
            ...(normalizedStudentId ? [{ studentId: normalizedStudentId }] : []),
          ],
        },
        attributes: ["username", "email", "studentId"],
      });

      if (conflictingUser) {
        if (conflictingUser.username.toLowerCase() === normalizedUsername.toLowerCase()) {
          throw new ConflictError("Username is already in use");
        }
        if (conflictingUser.email.toLowerCase() === normalizedEmail.toLowerCase()) {
          throw new ConflictError("Email is already in use");
        }
        throw new ConflictError("Student ID is already in use");
      }

      await user.update({
        avatar,
        username: normalizedUsername,
        firstName,
        lastName,
        studentId: normalizedStudentId,
        email: normalizedEmail,
        isActive,
      });

      if (roleIds !== undefined) {
        const roles = roleIds.length ? await Role.findAll({ where: { id: roleIds } }) : [];
        await user.setRoles(roles);
      }

      await logActivity({
        userId: req.user.id,
        action: "updated",
        targetType: "user",
        targetId: user.id,
        targetName: `${user.firstName} ${user.lastName}`.trim() || user.username,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      const updated = await User.findByPk(user.id, {
        include: [{ association: "Roles", through: { attributes: [] } }],
      });

      invalidateUserCache(user.id); // clear 30s auth cache so role/status change takes effect
      return ResponseFormatter.success(res, updated, "User updated successfully");
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /api/users/:id  (soft delete) 
  static async delete(req, res, next) {
    try {
      if (Number(req.params.id) === Number(req.user.id)) {
        throw new ValidationError("You cannot delete your own account");
      }

      const user = await User.findByPk(req.params.id);
      if (!user) throw new NotFoundError("User not found");

      await user.update({ isDeleted: true, isActive: false });

      await logActivity({
        userId: req.user.id,
        action: "deleted",
        targetType: "user",
        targetId: user.id,
        targetName: `${user.firstName} ${user.lastName}`.trim() || user.username,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      Logger.info(`Soft-deleted user ${user.username} by admin ${req.user.id}`);
      return ResponseFormatter.noContent(res, null, "User deleted successfully");
    } catch (err) {
      next(err);
    }
  }

  // ── PATCH /api/users/:id/roles ──
  static async assignRoles(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [{ association: "Roles", through: { attributes: [] } }],
      });
      if (!user) throw new NotFoundError("User not found");

      const { roleIds = [] } = req.body;

      const roles = roleIds.length ? await Role.findAll({ where: { id: roleIds } }) : [];
      await user.addRoles(roles);

      await logActivity({
        userId: req.user.id,
        action: "updated",
        targetType: "user",
        targetId: user.id,
        targetName: `${user.firstName} ${user.lastName}`.trim() || user.username,
        details: { roleIds },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      const updated = await User.findByPk(user.id, {
        include: [{ association: "Roles", through: { attributes: [] } }],
      });

      return ResponseFormatter.success(res, updated, "Roles assigned to user successfully");
    } catch (err) {
      next(err);
    }
  }

  // ── PUT /api/users/:id/permissions 
  static async assignPermissions(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [{ association: "Permissions", through: { attributes: [] } }],
      });
      if (!user) throw new NotFoundError("User not found");

      const { permissionIds = [] } = req.body;

      const perms = permissionIds.length ? await Permission.findAll({ where: { id: permissionIds } }) : [];
      await user.setPermissions(perms);

      await logActivity({
        userId: req.user.id,
        action: "updated",
        targetType: "user",
        targetId: user.id,
        targetName: `${user.firstName} ${user.lastName}`.trim() || user.username,
        details: { permissionIds },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      const updated = await User.findByPk(user.id, {
        include: [{ association: "Permissions", through: { attributes: [] } }],
      });

      return ResponseFormatter.success(res, updated, "Permissions assigned to user successfully");
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/users/:id/avatar (public) 
  // Returns a signed R2 redirect for any user's avatar (no auth required).
  static async getAvatarById(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id, { attributes: ['id', 'avatar'] });
      if (!user || !user.avatar) {
        return res.status(404).json({ success: false, message: 'Avatar not found' });
      }

      const key = extractKeyFromUrl(user.avatar);

      // Legacy external URL — redirect directly
      if (!key) {
        res.set('Cache-Control', 'public, max-age=600');
        return res.redirect(302, user.avatar);
      }

      const signedUrl = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
        }),
        { expiresIn: 3600 }
      );

      res.set('Cache-Control', 'public, max-age=600');
      return res.redirect(302, signedUrl);
    } catch (err) { next(err); }
  }

  // ── POST /api/users/:id/avatar  (admin: upload/replace any user's avatar) ──
  static async uploadAvatarById(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) throw new NotFoundError('User not found');

      if (!req.file) {
        return ResponseFormatter.error(res, 'No file provided', 400, 'BAD_REQUEST');
      }

      const result = await uploadToR2(req.file, 'avatar');
      await user.update({ avatar: result.secure_url });

      await logActivity({
        userId: req.user.id,
        action: 'updated',
        targetType: 'user',
        targetId: user.id,
        targetName: `${user.firstName} ${user.lastName}`.trim() || user.username,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return ResponseFormatter.success(res, { avatar: result.secure_url }, 'Avatar updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
