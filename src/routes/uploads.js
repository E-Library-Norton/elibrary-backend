const express = require("express");
const router = express.Router();
const UploadController = require("../controllers/uploadController");
const { authenticate, requirePermission } = require("../middleware/auth");
const { uploadSingle, uploadMulti } = require("../middleware/upload");

// Single upload
router.post(
  "/single",
  authenticate,
  requirePermission("books.create"),
  uploadSingle,
  UploadController.uploadSingle
);

// Multiple upload
router.post(
  "/multiple",
  authenticate,
  requirePermission("books.create"),
  uploadMulti,
  UploadController.uploadMultiple
);

// Delete file
router.post(
  "/delete",
  authenticate,
  requirePermission("books.delete"),
  UploadController.deleteFile
);

module.exports = router;