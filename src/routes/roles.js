// src/routes/roles.js
const express = require("express");
const router = express.Router();

const RoleController = require("../controllers/roleController");
const { authenticate, requirePermission } = require("../middleware/auth");
const { roleRules } = require("../middleware/validation");

router.use(authenticate);

// Permission-based role management
router.get("/", requirePermission("roles.view"), RoleController.getAll);
router.get("/:id", roleRules.id, requirePermission("roles.view"), RoleController.getById);
router.post("/", requirePermission("roles.create"), roleRules.create, RoleController.create);
router.put("/:id", requirePermission("roles.update"), roleRules.update, RoleController.update);
router.delete("/:id", requirePermission("roles.delete"), roleRules.id, RoleController.delete);
router.put("/:id/permissions", requirePermission("roles.update"), roleRules.assignPermissions, RoleController.assignRolePermissions);

module.exports = router;