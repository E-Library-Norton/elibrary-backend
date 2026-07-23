// ============================================
// FILE: src/middleware/errorHandler.js
// ============================================

const ResponseFormatter = require("../utils/responseFormatter");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ResponseFormatter.validationError(res, errors);
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    return ResponseFormatter.error(
      res,
      "A record with this value already exists",
      409,
      "DUPLICATE_ENTRY"
    );
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return ResponseFormatter.error(
      res,
      "Cannot delete record - it is referenced by other records",
      400,
      "FOREIGN_KEY_CONSTRAINT"
    );
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return ResponseFormatter.unauthorized(res, "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    return ResponseFormatter.unauthorized(res, "Token expired");
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return ResponseFormatter.error(
        res,
        "File too large",
        400,
        "FILE_TOO_LARGE"
      );
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return ResponseFormatter.error(
        res,
        "Too many files",
        400,
        "TOO_MANY_FILES"
      );
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return ResponseFormatter.error(
        res,
        "Unexpected file field",
        400,
        "UNEXPECTED_FILE"
      );
    }
    return ResponseFormatter.error(res, err.message, 400, "FILE_UPLOAD_ERROR");
  }

  // Custom app errors with status property
  if (err.status) {
    return ResponseFormatter.error(
      res,
      err.message || "An error occurred",
      err.status,
      err.code || "APPLICATION_ERROR"
    );
  }

  // Default error
  return ResponseFormatter.error(
    res,
    err.message || "Internal server error",
    500,
    err.code || "INTERNAL_ERROR"
  );
};

module.exports = errorHandler;
