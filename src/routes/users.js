// src/routes/users.js
const express = require("express");
const router = express.Router();
const multer = require('multer');

const UserController = require("../controllers/userController");
const { authenticate, requirePermission } = require("../middleware/auth");
const { userRules } = require("../middleware/validation");

// Memory-based multer for avatar uploads
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
}).single('avatar');

// ── Public: anyone can fetch a user's avatar (returns signed R2 redirect) ────
router.get("/:id/avatar", UserController.getAvatarById);

// All remaining user routes require a valid token
router.use(authenticate);

// Admins can manage users
router.get("/", requirePermission("users.view"), UserController.getAll);
router.get("/:id", userRules.id, requirePermission("users.view"), UserController.getById);
router.post("/", userRules.create, requirePermission("users.create"), UserController.create);
router.patch("/:id", userRules.update, requirePermission("users.update"), UserController.update);
router.delete("/:id", userRules.id, requirePermission("users.delete"), UserController.delete);

// Upload/replace a user's avatar — requires users.update permission
router.post("/:id/avatar", requirePermission("users.update"), avatarUpload, UserController.uploadAvatarById);

// Assign roles / direct permissions — requires users.update permission
router.patch("/:id/roles", userRules.assignRoles, requirePermission("users.update"), UserController.assignRoles);
router.put("/:id/permissions", userRules.assignPermissions, requirePermission("users.update"), UserController.assignPermissions);

module.exports = router;