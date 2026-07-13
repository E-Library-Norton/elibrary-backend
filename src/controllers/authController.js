const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, User, Role, PasswordResetChallenge } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, AuthenticationError, NotFoundError } = require('../utils/errors');
const { logActivity } = require('../utils/activityLogger');
const { uploadToR2, extractKeyFromUrl } = require('../utils/cloudR2Upload');
const { sendOtpEmail } = require('../utils/emailService');
const r2 = require('../config/r2');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function getPasswordResetSecret() {
  const secret = process.env.FORGOT_PASSWORD_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('FORGOT_PASSWORD_SECRET must contain at least 32 characters');
  }
  return secret;
}

function hashChallengeToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashOtp(token, otp) {
  return crypto
    .createHmac('sha256', getPasswordResetSecret())
    .update(`${token}:${otp}`)
    .digest('hex');
}

function otpMatches(expectedHash, token, otp) {
  const actual = Buffer.from(hashOtp(token, otp), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function invalidResetCodeError() {
  return new AuthenticationError('Code is invalid or expired. Please request a new one');
}

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

      const existing = await User.findOne({
        where: { [Op.or]: [{ username }, { email }, { studentId }] },
      });
      if (existing) throw new ValidationError('Username, Email or Student ID already registered');

      const user = await User.create({ username, email, password, firstName, lastName, studentId });

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

      const user = await User.findOne({
        where: { [Op.or]: [{ username: identifier }, { email: identifier }, { studentId: identifier }] },
        include: { association: 'Roles' },
        attributes: { include: ['twoFactorSecret', 'faceDescriptor'] },
      });

      if (!user) {
        throw new AuthenticationError('No account found with that username, email, or student ID');
      }
      if (!(await user.validatePassword(password))) {
        throw new AuthenticationError('Incorrect password. Please try again');
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

      await user.update({ avatar, firstName, lastName, email, studentId });

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
      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        throw new ValidationError('New password must be at least 8 characters');
      }
      if (newPassword !== confirmPassword) {
        throw new ValidationError('New passwords do not match');
      }

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
  // Step 1: create an opaque challenge and email a separately stored, hashed OTP.
  static async forgotPassword(req, res, next) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      if (!email) throw new ValidationError('Email is required');

      const user = await User.scope(null).findOne({
        where: { email, isDeleted: false },
        attributes: ['id', 'email', 'firstName', 'password'],
      });

      // Always return the same-shaped opaque token, even for an unknown email.
      // The token contains no user ID or OTP and cannot be decoded for account data.
      const sessionToken = crypto.randomBytes(32).toString('base64url');

      if (user) {
        const otp = String(crypto.randomInt(100000, 1000000));
        const tokenHash = hashChallengeToken(sessionToken);

        await PasswordResetChallenge.upsert({
          userId: user.id,
          tokenHash,
          otpHash: hashOtp(sessionToken, otp),
          attempts: 0,
          expiresAt: new Date(Date.now() + OTP_TTL_MS),
          verifiedAt: null,
          usedAt: null,
        });

        // Do not reveal SMTP failures or account existence through the response.
        // Railway is a persistent process, so delivery can finish after the 200 response.
        sendOtpEmail(user.email, otp, user.firstName).catch(async (err) => {
          console.error(`[Password reset email] ${err.code || 'DELIVERY_FAILED'}: ${err.message}`);
          await PasswordResetChallenge.destroy({ where: { tokenHash } }).catch((cleanupErr) => {
            console.error(`[Password reset cleanup] ${cleanupErr.message}`);
          });
        });
      }

      return ResponseFormatter.success(
        res,
        { sessionToken },
        'If that email is registered, a code has been sent'
      );
    } catch (err) { next(err); }
  }

  // POST /api/auth/verify-otp
  // Step 2: verify the 6-digit code. Returns a short-lived resetToken if correct.
  static async verifyOtp(req, res, next) {
    try {
      const { sessionToken, otp } = req.body;
      if (!sessionToken) throw new ValidationError('Session token is required');
      if (!/^\d{6}$/.test(String(otp || ''))) throw new ValidationError('A valid 6-digit code is required');

      const tokenHash = hashChallengeToken(String(sessionToken));
      const verification = await sequelize.transaction(async (transaction) => {
        const challenge = await PasswordResetChallenge.findOne({
          where: { tokenHash },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        const now = new Date();
        if (!challenge || challenge.usedAt || challenge.verifiedAt || challenge.expiresAt <= now) {
          return { ok: false };
        }

        if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
          await challenge.update({ usedAt: now }, { transaction });
          return { ok: false };
        }

        const attempts = challenge.attempts + 1;
        if (!otpMatches(challenge.otpHash, String(sessionToken), String(otp))) {
          await challenge.update({
            attempts,
            usedAt: attempts >= MAX_OTP_ATTEMPTS ? now : null,
          }, { transaction });
          return { ok: false };
        }

        const user = await User.scope(null).findOne({
          where: { id: challenge.userId, isDeleted: false },
          attributes: ['id'],
          transaction,
        });
        if (!user) {
          await challenge.update({ usedAt: now }, { transaction });
          return { ok: false };
        }

        await challenge.update({
          attempts,
          verifiedAt: now,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        }, { transaction });

        return { ok: true, userId: user.id, challengeId: challenge.id };
      });

      if (!verification.ok) throw invalidResetCodeError();

      const resetToken = jwt.sign(
        {
          sub: String(verification.userId),
          challengeId: String(verification.challengeId),
          purpose: 'password-reset',
        },
        getPasswordResetSecret(),
        { expiresIn: '15m' }
      );

      return ResponseFormatter.success(res, { resetToken }, 'Code verified successfully');
    } catch (err) { next(err); }
  }

  // POST /api/auth/reset-password
  // Step 3: set the new password using the resetToken from step 2.
  static async resetPassword(req, res, next) {
    try {
      const { resetToken, password, confirmPassword } = req.body;
      if (!resetToken) throw new ValidationError('Reset token is required');
      if (!password) throw new ValidationError('New password is required');
      if (password !== confirmPassword) throw new ValidationError('Passwords do not match');
      if (password.length < 8) throw new ValidationError('Password must be at least 8 characters');

      let payload;
      try {
        payload = jwt.verify(resetToken, getPasswordResetSecret());
      } catch {
        throw new AuthenticationError('Reset session expired. Please start over');
      }

      if (payload.purpose !== 'password-reset' || !payload.sub || !payload.challengeId) {
        throw new AuthenticationError('Invalid reset token');
      }

      const reset = await sequelize.transaction(async (transaction) => {
        const challenge = await PasswordResetChallenge.findByPk(payload.challengeId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        const now = new Date();

        if (
          !challenge ||
          String(challenge.userId) !== String(payload.sub) ||
          !challenge.verifiedAt ||
          challenge.usedAt ||
          challenge.expiresAt <= now
        ) {
          return false;
        }

        const user = await User.scope(null).findOne({
          where: { id: payload.sub, isDeleted: false },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!user) return false;

        await user.update({ password }, { transaction });
        await challenge.update({ usedAt: now }, { transaction });
        return true;
      });

      if (!reset) throw new AuthenticationError('Reset session expired. Please start over');

      return ResponseFormatter.success(res, null, 'Password reset successfully. You can now sign in.');
    } catch (err) { next(err); }
  }
}

module.exports = AuthController;
