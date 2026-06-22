// src/controllers/twoFactorController.js
// Handles TOTP setup (QR code), OTP verification, recovery codes, face enrollment & verification.
'use strict';

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { ValidationError, AuthenticationError } = require('../utils/errors');

// ── Recovery-code helpers 
function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase().replace(/(.{4})(.{4})/, '$1-$2')
  );
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code.replace(/-/g, '').toUpperCase()).digest('hex');
}

class TwoFactorController {

  // ── POST /api/auth/2fa/setup 
  // Generates a TOTP secret and returns a QR code (data URL).
  // The secret is saved but 2FA is NOT enabled until /2fa/verify-setup confirms it.
  static async setup(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) throw new AuthenticationError('User not found');

      if (user.twoFactorEnabled) {
        throw new ValidationError('Two-factor authentication is already enabled. Disable it first to re-setup.');
      }

      const secret = speakeasy.generateSecret({
        name: `E-Library NU (${user.email})`,
        issuer: 'E-Library NU',
        length: 20,
      });

      // Store the base32 secret (not yet enabled)
      await user.update({ twoFactorSecret: secret.base32 });

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

      return ResponseFormatter.success(res, {
        qrCode: qrDataUrl,
        secret: secret.base32,   // user can manually enter this in their app
        otpauthUrl: secret.otpauth_url,
      }, 'Scan this QR code with your authenticator app, then verify with a code.');
    } catch (err) { next(err); }
  }

  // ── POST /api/auth/2fa/verify-setup 
  // Confirms the TOTP setup by verifying the first code from the authenticator app.
  // On success, sets twoFactorEnabled = true.
  static async verifySetup(req, res, next) {
    try {
      const { token: otpToken } = req.body;
      if (!otpToken) throw new ValidationError('OTP token is required');

      const user = await User.unscoped().findByPk(req.user.id);
      if (!user) throw new AuthenticationError('User not found');
      if (!user.twoFactorSecret) throw new ValidationError('No 2FA secret found. Call /2fa/setup first.');

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: otpToken,
        window: 2,    // allow 2 time steps (±30 seconds)
      });

      if (!isValid) throw new AuthenticationError('Invalid OTP code. Please try again.');

      // Generate recovery codes, store hashed versions
      const recoveryCodes = generateRecoveryCodes(8);
      const hashedCodes = recoveryCodes.map(hashCode);

      await user.update({
        twoFactorEnabled: true,
        recoveryCodes: JSON.stringify(hashedCodes),
      });

      return ResponseFormatter.success(res, {
        twoFactorEnabled: true,
        recoveryCodes,          // plain codes shown ONCE to the user
      }, 'Two-factor authentication enabled successfully.');
    } catch (err) { next(err); }
  }

  // ── POST /api/auth/2fa/verify 
  // Verifies an OTP during login (called after password check).
  // Expects a temporary 2FA token in the Authorization header.
  static async verify(req, res, next) {
    try {
      const { token: otpToken, recoveryCode, tempToken } = req.body;
      if (!otpToken && !recoveryCode) throw new ValidationError('OTP token or recovery code is required');
      if (!tempToken) throw new ValidationError('Temporary login token is required');

      // Decode the temp token
      const jwt = require('jsonwebtoken');
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.ACCESS_TOKEN_SECRET);
      } catch {
        throw new AuthenticationError('Invalid or expired temporary token');
      }

      if (!decoded.requires2FA) {
        throw new ValidationError('This token does not require 2FA verification');
      }

      const user = await User.unscoped().findByPk(decoded.id, {
        include: { association: 'Roles', through: { attributes: [] } },
      });
      if (!user) throw new AuthenticationError('User not found');

      let verified = false;

      if (recoveryCode) {
        // ── Recovery code path ──
        const stored = user.recoveryCodes ? JSON.parse(user.recoveryCodes) : [];
        const incoming = hashCode(recoveryCode);
        const idx = stored.indexOf(incoming);
        if (idx === -1) throw new AuthenticationError('Invalid recovery code');
        // Remove used code
        stored.splice(idx, 1);
        await user.update({ recoveryCodes: JSON.stringify(stored) });
        verified = true;
      } else {
        // ── TOTP path ──
        verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: otpToken,
          window: 3,
        });
      }

      if (!verified) throw new AuthenticationError('Invalid or expired OTP code. Please check the code in your authenticator app and try again.');

      // Issue the real access + refresh tokens
      const AuthController = require('./authController');
      const accessToken = AuthController.generateAccessToken(user);
      const refreshToken = AuthController.generateRefreshToken(user);

      return ResponseFormatter.success(res, {
        user: {
          id: user.id, avatar: user.avatar, username: user.username,
          email: user.email, studentId: user.studentId,
          firstName: user.firstName, lastName: user.lastName,
          roles: user.Roles.map(r => r.name),
          twoFactorEnabled: user.twoFactorEnabled,
        },
        accessToken,
        refreshToken,
      }, 'Two-factor authentication verified. Login successful.');
    } catch (err) { next(err); }
  }

  // ── POST /api/auth/2fa/disable 
  // Disables 2FA (requires current OTP or password to confirm).
  static async disable(req, res, next) {
    try {
      const { token: otpToken, password } = req.body;

      const user = await User.unscoped().findByPk(req.user.id);
      if (!user) throw new AuthenticationError('User not found');
      if (!user.twoFactorEnabled) throw new ValidationError('2FA is not enabled');

      // Must provide either a valid OTP or their password
      let authorized = false;

      if (otpToken) {
        authorized = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: otpToken,
          window: 2,
        });
      }

      if (!authorized && password) {
        authorized = await user.validatePassword(password);
      }

      if (!authorized) {
        throw new AuthenticationError('Provide a valid OTP code or your password to disable 2FA');
      }

      await user.update({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        faceDescriptor: null,
        recoveryCodes: null,
      });

      return ResponseFormatter.success(res, { twoFactorEnabled: false },
        'Two-factor authentication disabled.');
    } catch (err) { next(err); }
  }

  // ── GET /api/auth/2fa/status 
  // Returns 2FA status for the authenticated user.
  static async status(req, res, next) {
    try {
      const user = await User.unscoped().findByPk(req.user.id);
      if (!user) throw new AuthenticationError('User not found');

      const stored = user.recoveryCodes ? JSON.parse(user.recoveryCodes) : [];

      return ResponseFormatter.success(res, {
        twoFactorEnabled: user.twoFactorEnabled,
        hasFaceEnrolled: !!user.faceDescriptor,
        recoveryCodesRemaining: stored.length,
      }, 'Two-factor status');
    } catch (err) { next(err); }
  }

  // ── POST /api/auth/2fa/regenerate-recovery
  // Regenerates recovery codes (requires password confirmation).
  static async regenerateRecovery(req, res, next) {
    try {
      const { password } = req.body;
      if (!password) throw new ValidationError('Password is required');

      const user = await User.unscoped().findByPk(req.user.id);
      if (!user) throw new AuthenticationError('User not found');
      if (!user.twoFactorEnabled) throw new ValidationError('2FA is not enabled');

      const valid = await user.validatePassword(password);
      if (!valid) throw new AuthenticationError('Incorrect password');

      const recoveryCodes = generateRecoveryCodes(8);
      const hashedCodes = recoveryCodes.map(hashCode);
      await user.update({ recoveryCodes: JSON.stringify(hashedCodes) });

      return ResponseFormatter.success(res, { recoveryCodes },
        'Recovery codes regenerated. Save them in a safe place.');
    } catch (err) { next(err); }
  }

  // ── POST /api/auth/2fa/face/enroll 
  // Stores the face descriptor (128-dim Float32Array as JSON array).
  static async enrollFace(req, res, next) {
    try {
      const { descriptor } = req.body;
      if (!descriptor || !Array.isArray(descriptor)) {
        throw new ValidationError('Face descriptor array is required');
      }
      if (descriptor.length !== 128) {
        throw new ValidationError('Face descriptor must be a 128-dimension array');
      }

      const user = await User.findByPk(req.user.id);
      if (!user) throw new AuthenticationError('User not found');

      await user.update({ faceDescriptor: JSON.stringify(descriptor) });

      return ResponseFormatter.success(res, { hasFaceEnrolled: true },
        'Face enrolled successfully.');
    } catch (err) { next(err); }
  }

  // ── POST /api/auth/2fa/face/verify 
  // Compares a live face descriptor against the stored one using Euclidean distance.
  static async verifyFace(req, res, next) {
    try {
      const { descriptor, tempToken } = req.body;
      if (!descriptor || !Array.isArray(descriptor)) {
        throw new ValidationError('Face descriptor array is required');
      }

      // If tempToken is present, this is during login flow
      let userId = req.user?.id;
      if (tempToken) {
        const jwt = require('jsonwebtoken');
        let decoded;
        try {
          decoded = jwt.verify(tempToken, process.env.ACCESS_TOKEN_SECRET);
        } catch {
          throw new AuthenticationError('Invalid or expired temporary token');
        }
        userId = decoded.id;
      }

      const user = await User.unscoped().findByPk(userId);
      if (!user) throw new AuthenticationError('User not found');
      if (!user.faceDescriptor) throw new ValidationError('No face data enrolled');

      const stored = JSON.parse(user.faceDescriptor);

      // Euclidean distance between two 128-dim descriptors
      const distance = Math.sqrt(
        stored.reduce((sum, val, i) => sum + Math.pow(val - (descriptor[i] || 0), 2), 0)
      );

      // Threshold: 0.6 is standard for face-api.js (lower = stricter)
      const THRESHOLD = 0.6;
      const match = distance < THRESHOLD;

      if (!match) {
        throw new AuthenticationError(`Face verification failed (distance: ${distance.toFixed(3)}). Please try again.`);
      }

      return ResponseFormatter.success(res, {
        match: true,
        distance: parseFloat(distance.toFixed(4)),
      }, 'Face verified successfully.');
    } catch (err) { next(err); }
  }
}

module.exports = TwoFactorController;
