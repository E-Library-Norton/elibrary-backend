// ============================================
// FILE: src/middleware/rateLimiter.js
// ============================================

const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints (register, logout, etc.)
const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 20,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Very strict rate limiter specifically for login — brute-force protection
const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2-minute window
  max: 10,                  // max 10 failed attempts per IP per window
  skipSuccessfulRequests: true, // only count failures toward the cap
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => {
    // Key by IP + identifier so per-account brute-force is also tracked
    const identifier = (req.body && (req.body.email || req.body.username || req.body.studentId)) || '';
    return `${req.ip}:${identifier.toLowerCase()}`;
  },
  message: {
    success: false,
    error: {
      code: "LOGIN_LIMIT_EXCEEDED",
      message: "Too many failed login attempts. Please wait 2 minutes before trying again.",
    },
  },
});

// Upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: {
      code: "UPLOAD_LIMIT_EXCEEDED",
      message: "Upload limit exceeded, please try again later.",
    },
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  uploadLimiter,
};
