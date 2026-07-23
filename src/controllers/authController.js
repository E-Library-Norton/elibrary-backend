const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Role } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');
const { uploadToR2, extractKeyFromUrl } = require('../utils/cloudR2Upload');
const { sendOtpEmail } = require('../utils/emailService');
const r2 = require('../config/r2');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class AuthController {

  static generateAccessToken(user) {
    const roles = (user.Roles || []).map(r => r.name);
    return require('jsonwebtoken').sign(
      { id: user.id, username: user.username, email: user.email, studentId: user.studentId, roles },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '30d' }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '60d' }
    );
  }

  // POST /api/auth/register
  static async register(req, res, next) {
    try {
      const { username, email, password, firstName, lastName, studentId } = req.body;
      const normalizedStudentId = studentId?.trim() || null;
      const duplicateConditions = [
        { username: { [Op.iLike]: username } },
        { email: { [Op.iLike]: email } },
      ];

      if (normalizedStudentId) {
        duplicateConditions.push({ studentId: normalizedStudentId });
      }

      const existing = await User.findOne({
        where: { [Op.or]: duplicateConditions },
      });
      if (existing) throw new ValidationError('Username, Email or Student ID already registered');

      const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        studentId: normalizedStudentId,
      });

      const defaultRole = await Role.findOne({ where: { name: 'user' } });
      if (defaultRole) await user.addRole(defaultRole);

      return ResponseFormatter.success(res, {
        user: { id: user.id, username: user.username, email: user.email, studentId: user.studentId },
      }, 'Registration successful', 201);
    } catch (err) { next(err); }
  }

  // POST /api/auth/login
  static async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const normalizedIdentifier = identifier.trim();

      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username: { [Op.iLike]: normalizedIdentifier } },
            { email: { [Op.iLike]: normalizedIdentifier } },
            { studentId: normalizedIdentifier },
          ],
        },
        include: { association: 'Roles' },
        attributes: { include: ['twoFactorSecret', 'faceDescriptor'] },
      });

      if (!user) {
        throw new AuthenticationError('No account found with that username, email, or student ID');
      }
      if (!(await user.validatePassword(password))) {
        throw new AuthenticationError('The provided credentials are incorrect');
      }
      if (!user.isActive) throw new AuthenticationError('Your account has been deactivated. Please contact an administrator');

      // ── 2FA check 
      if (user.twoFactorEnabled) {
        // Issue a short-lived temp token that must be exchanged via /2fa/verify
        const tempToken = jwt.sign(
          { id: user.id, requires2FA: true },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '5m' },
        );

        logActivity({ userId: user.id, action: 'login_2fa_pending', targetId: user.id, targetName: user.username, targetType: 'user' });

        return ResponseFormatter.success(res, {
          requires2FA: true,
          tempToken,
          hasFaceEnrolled: !!user.faceDescriptor,
        }, 'Two-factor authentication required');
      }
      // ── end 2FA check 

      const accessToken = AuthController.generateAccessToken(user);
      const refreshToken = AuthController.generateRefreshToken(user);

      logActivity({ userId: user.id, action: 'login', targetId: user.id, targetName: user.username, targetType: 'user' });

      const { roles: roleNames, permissions } = await user.getRolesAndPermissions();

      return ResponseFormatter.success(res, {
        user: {
          id: user.id, avatar: user.avatar, username: user.username,
          email: user.email, studentId: user.studentId,
          firstName: user.firstName, lastName: user.lastName,
          roles: roleNames,
          permissions,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        accessToken,
        refreshToken,
      }, 'Login successful');
    } catch (err) { next(err); }
  }

  // POST /api/auth/refresh
  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new ValidationError('refreshToken is required');

      let decoded;
      try { decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); }
      catch { throw new AuthenticationError('Invalid or expired refresh token'); }

      const user = await User.findByPk(decoded.id, {
        include: { association: 'Roles', through: { attributes: [] } },
      });
      if (!user) throw new AuthenticationError('User not found');
      if (!user.isActive) throw new AuthenticationError('Account is deactivated');

      return ResponseFormatter.success(res, {
        accessToken: AuthController.generateAccessToken(user),
      }, 'Token refreshed');
    } catch (err) { next(err); }
  }

  // POST /api/auth/logout
  static async logout(_req, res, next) {
    try {
      return ResponseFormatter.success(res, null, 'Logged out successfully');
    } catch (err) { next(err); }
  }

  // GET /api/auth/profile
  static async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: { association: 'Roles', through: { attributes: [] } },
      });
      if (!user) throw new NotFoundError('User not found');

      const { roles: roleNames, permissions } = await user.getRolesAndPermissions();

      return ResponseFormatter.success(res, {
        id: user.id, avatar: user.avatar, username: user.username,
        email: user.email, studentId: user.studentId,
        firstName: user.firstName, lastName: user.lastName,
        roles: roleNames, permissions,
        twoFactorEnabled: user.twoFactorEnabled, createdAt: user.createdAt,
      });
    } catch (err) { next(err); }
  }

  // PATCH /api/auth/profile
  static async updateProfile(req, res, next) {
    try {
      const { avatar, firstName, lastName, email, studentId } = req.body;
      const user = await User.findByPk(req.user.id);
      if (!user) throw new NotFoundError('User not found');

      const normalizedEmail = email ?? user.email;
      const normalizedStudentId =
        studentId === undefined ? user.studentId : studentId?.trim() || null;

      const conflictingUser = await User.scope(null).findOne({
        where: {
          id: { [Op.ne]: user.id },
          [Op.or]: [
            { email: { [Op.iLike]: normalizedEmail } },
            ...(normalizedStudentId ? [{ studentId: normalizedStudentId }] : []),
          ],
        },
        attributes: ['email', 'studentId'],
      });

      if (conflictingUser) {
        if (conflictingUser.email.toLowerCase() === normalizedEmail.toLowerCase()) {
          throw new ConflictError('Email is already in use');
        }
        throw new ConflictError('Student ID is already in use');
      }

      await user.update({
        avatar,
        firstName,
        lastName,
        email: normalizedEmail,
        studentId: normalizedStudentId,
      });

      return ResponseFormatter.success(res, {
        id: user.id, avatar: user.avatar, email: user.email,
        studentId: user.studentId, firstName: user.firstName, lastName: user.lastName,
      }, 'Profile updated successfully');
    } catch (err) { next(err); }
  }

  // POST /api/auth/avatar
  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file) throw new ValidationError('No image file provided');

      const user = await User.findByPk(req.user.id);
      if (!user) throw new NotFoundError('User not found');

      const result = await uploadToR2(req.file, 'avatar');
      await user.update({ avatar: result.secure_url });

      return ResponseFormatter.success(res, { avatar: result.secure_url }, 'Avatar updated successfully');
    } catch (err) { next(err); }
  }

  // GET /api/auth/avatar
  static async getAvatar(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, { attributes: ['id', 'avatar'] });
      if (!user) throw new NotFoundError('User not found');
      if (!user.avatar) throw new NotFoundError('Avatar not found');

      const key = extractKeyFromUrl(user.avatar);

      // If avatar URL is not an R2-managed URL (legacy external URL), redirect directly.
      if (!key) {
        res.set('Cache-Control', 'private, max-age=300');
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

      res.set('Cache-Control', 'private, max-age=300');
      return res.redirect(302, signedUrl);
    } catch (err) { next(err); }
  }

  // PUT /api/auth/change-password
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) throw new NotFoundError('User not found');
      if (!(await user.validatePassword(currentPassword))) {
        throw new ValidationError('Current password is incorrect');
      }

      await user.update({ password: newPassword });
      return ResponseFormatter.success(res, null, 'Password changed successfully');
    } catch (err) { next(err); }
  }

  // POST /api/auth/forgot-password
  // Checks whether an active account exists before enabling the reset-code button.
  static async checkPasswordResetEmail(req, res, next) {
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
      if (!email) throw new ValidationError('Email is required');

      const user = await User.scope(null).findOne({
        where: { email, isDeleted: false },
        attributes: ['id'],
      });

      return ResponseFormatter.success(
        res,
        { exists: Boolean(user) },
        user ? 'Email is registered' : 'This email is not registered'
      );
    } catch (err) { next(err); }
  }

  // POST /api/auth/forgot-password
  // Step 1: generate 6-digit OTP, embed in signed JWT (sessionToken), send OTP to email.
  static async forgotPassword(req, res, next) {
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
      if (!email) throw new ValidationError('Email is required');

      const user = await User.scope(null).findOne({
        where: { email, isDeleted: false },
        attributes: ['id', 'email', 'firstName', 'password'],
      });

      if (!user) {
        throw new NotFoundError('This email is not registered.');
      }

      // 6-digit OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      // Store OTP inside a JWT signed with SECRET+password_hash (auto-invalidates after password change)
      const sessionToken = jwt.sign(
        { id: user.id, otp },
        process.env.FORGOT_PASSWORD_SECRET + user.password,
        { expiresIn: '10m' }
      );

      await sendOtpEmail(user.email, otp, user.firstName);

      // Return sessionToken to frontend so it can send it back during OTP verification
      return ResponseFormatter.success(res, { sessionToken }, 'A 6-digit code has been sent to your email');
    } catch (err) { next(err); }
  }

  // POST /api/auth/verify-otp
  // Step 2: verify the 6-digit code. Returns a short-lived resetToken if correct.
  static async verifyOtp(req, res, next) {
    try {
      const { sessionToken, otp } = req.body;
      if (!sessionToken) throw new ValidationError('Session token is required');
      if (!otp) throw new ValidationError('Code is required');

      // Decode (unverified) to get user ID
      const decoded = jwt.decode(sessionToken);
      if (!decoded?.id) throw new AuthenticationError('Invalid session. Please request a new code');

      const user = await User.scope(null).findOne({
        where: { id: decoded.id, isDeleted: false },
        attributes: ['id', 'password'],
      });
      if (!user) throw new NotFoundError('User not found');

      // Verify signature + expiry
      let payload;
      try {
        payload = jwt.verify(sessionToken, process.env.FORGOT_PASSWORD_SECRET + user.password);
      } catch {
        throw new AuthenticationError('Code has expired or is invalid. Please request a new one');
      }

      if (String(payload.otp) !== String(otp)) {
        throw new AuthenticationError('Incorrect code. Please try again');
      }

      // Issue a short-lived resetToken (15 min)
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.FORGOT_PASSWORD_SECRET + user.password + '_reset',
        { expiresIn: '15m' }
      );

      return ResponseFormatter.success(res, { resetToken }, 'Code verified successfully');
    } catch (err) { next(err); }
  }

  // POST /api/auth/reset-password
  // Step 3: set the new password using the resetToken from step 2.
  static async resetPassword(req, res, next) {
    try {
      const { resetToken, password } = req.body;

      const decoded = jwt.decode(resetToken);
      if (!decoded?.id) throw new AuthenticationError('Invalid reset token');

      const user = await User.scope(null).findOne({
        where: { id: decoded.id, isDeleted: false },
        attributes: ['id', 'password'],
      });
      if (!user) throw new NotFoundError('User not found');

      try {
        jwt.verify(resetToken, process.env.FORGOT_PASSWORD_SECRET + user.password + '_reset');
      } catch {
        throw new AuthenticationError('Reset session expired. Please start over');
      }

      await user.update({ password });

      return ResponseFormatter.success(res, null, 'Password reset successfully. You can now sign in.');
    } catch (err) { next(err); }
  }
}

module.exports = AuthController;
