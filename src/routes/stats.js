// ============================================
// FILE: src/routes/stats.js
// ============================================

const express = require("express");
const router = express.Router();
const StatsController = require("../controllers/statsController");
const { authenticate, requirePermission } = require("../middleware/auth");

router.get(
  "/overview",
  authenticate,
  requirePermission("users.view"),
  StatsController.getOverview
);

router.get("/popular", StatsController.getPopular);
router.get("/recent", StatsController.getRecent);
router.get("/public", StatsController.getPublicStats);

module.exports = router;
