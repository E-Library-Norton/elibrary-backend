// src/routes/permissions.js
const express = require("express");
const router = express.Router();
const PermissionController = require("../controllers/permissionController");
const { authenticate, requirePermission } = require("../middleware/auth");
const { permissionRules } = require("../middleware/validation");

router.use(authenticate);

// Permission-based permission management
router.get("/", requirePermission("permissions.view"), PermissionController.getAll);
router.get("/:id", permissionRules.id, requirePermission("permissions.view"), PermissionController.getById);
router.post("/", requirePermission("permissions.create"), permissionRules.create, PermissionController.create);
router.put("/:id", requirePermission("permissions.update"), permissionRules.update, PermissionController.update);
router.delete("/:id", requirePermission("permissions.delete"), permissionRules.id, PermissionController.delete);
router.put("/:id/roles", requirePermission("permissions.assign"), permissionRules.assignRoles, PermissionController.assignRoles);

module.exports = router;