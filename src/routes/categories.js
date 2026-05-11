// ============================================
// FILE: src/routes/categories.js
// ============================================

const express = require("express");
const router = express.Router();
const CategoryController = require("../controllers/categoryController");
const { authenticate, requirePermission } = require("../middleware/auth");
const { idValidation } = require("../middleware/validation");

router.get("/", CategoryController.getAll);

router.get("/:id", idValidation, CategoryController.getById);

router.post("/", authenticate, requirePermission("books.create"), CategoryController.create);

router.put(
  "/:id",
  authenticate,
  requirePermission("books.update"),
  idValidation,
  CategoryController.update
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("books.delete"),
  idValidation,
  CategoryController.delete
);

module.exports = router;
