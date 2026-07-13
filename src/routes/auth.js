// src/routes/auth.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const {
  loginLimiter,
  authLimiter,
  passwordResetRequestLimiter,
  passwordResetActionLimiter,
} = require('../middleware/rateLimiter');
const { MAX_FILE_SIZES, FILE_TYPES } = require('../config/constants');
const { passport, FRONTEND_URL } = require('../config/passport');
const jwt = require('jsonwebtoken');

// Memory-based multer for avatar (R2 needs buffer)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZES.IMAGE },
  fileFilter(_req, file, cb) {
    const allowed = Array.isArray(FILE_TYPES.IMAGE) ? FILE_TYPES.IMAGE : [FILE_TYPES.IMAGE];
    cb(allowed.includes(file.mimetype) ? null : new Error('Only image files allowed'), allowed.includes(file.mimetype));
  },
}).single('avatar');

// auth routes
router.post('/register', authLimiter, userValidation.register, AuthController.register);
router.post('/login', loginLimiter, userValidation.login, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getProfile);
router.get('/profile', authenticate, AuthController.getProfile);
router.get('/avatar', authenticate, AuthController.getAvatar);
router.patch('/profile', authenticate, AuthController.updateProfile);
router.post('/avatar', authenticate, avatarUpload, AuthController.uploadAvatar);
router.put('/change-password', authenticate, AuthController.changePassword);
router.post('/forgot-password', passwordResetRequestLimiter, AuthController.forgotPassword);
router.post('/verify-otp', passwordResetActionLimiter, AuthController.verifyOtp);
router.post('/reset-password', passwordResetActionLimiter, AuthController.resetPassword);

// ── Two-Factor Authentication 
const TwoFactorController = require('../controllers/twoFactorController');

router.post('/2fa/setup', authenticate, TwoFactorController.setup);
router.post('/2fa/verify-setup', authenticate, TwoFactorController.verifySetup);
router.post('/2fa/verify', TwoFactorController.verify);
router.post('/2fa/disable', authenticate, TwoFactorController.disable);
router.post('/2fa/regenerate-recovery', authenticate, TwoFactorController.regenerateRecovery);
router.get('/2fa/status', authenticate, TwoFactorController.status);
router.post('/2fa/face/enroll', authenticate, TwoFactorController.enrollFace);
router.post('/2fa/face/verify', TwoFactorController.verifyFace);

// ── OAuth helper: generate tokens & redirect to frontend
function oauthCallback(provider) {
  return (req, res, next) => {
    passport.authenticate(provider, { session: false }, (err, user) => {
      if (err) {
        console.error(`[OAuth:${provider}] error:`, err.message || err);
        return res.redirect(`${FRONTEND_URL}/auth/signin?error=oauth_failed`);
      }
      if (!user) {
        console.error(`[OAuth:${provider}] no user returned`);
        return res.redirect(`${FRONTEND_URL}/auth/signin?error=oauth_failed`);
      }
      const roles = (user.Roles || []).map(r => r.name);
      const accessToken = jwt.sign(
        { id: user.id, username: user.username, email: user.email, studentId: user.studentId, roles },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '30d' },
      );
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '60d' },
      );
      const params = new URLSearchParams({ accessToken, refreshToken });
      return res.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);
    })(req, res, next);
  };
}

// ── Google 
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', oauthCallback('google'));

// ── Facebook 
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['public_profile'], session: false }));
router.get('/facebook/callback', oauthCallback('facebook'));

// ── GitHub 
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', oauthCallback('github'));

module.exports = router;
