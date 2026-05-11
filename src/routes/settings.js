// src/routes/settings.js
const express = require("express");
const router = express.Router();
const SettingController = require("../controllers/settingController");
const { authenticate, requirePermission } = require("../middleware/auth");

router.get("/", authenticate, SettingController.getAll);
router.post("/", authenticate, requirePermission("manage.users"), SettingController.updateBatch);

module.exports = router;
