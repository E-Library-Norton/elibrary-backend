// ============================================
// FILE: src/middleware/validation.js
// ============================================

const { body, param, query, validationResult } = require("express-validator");
const ResponseFormatter = require("../utils/responseFormatter");

const PASSWORD_PATTERN =
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])\S{8,20}$/;
const PASSWORD_MESSAGE =
  "Password must be 8-20 characters and include an uppercase letter, a lowercase letter, a number, and a special character";

const strongPassword = (field) =>
  body(field).matches(PASSWORD_PATTERN).withMessage(PASSWORD_MESSAGE);

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return ResponseFormatter.validationError(res, errors.array());
  }

  next();
};

// User validation rules
const userValidation = {
  register: [
    body("username")
      .trim()
      .toLowerCase()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ max: 50 })
      .withMessage("Username must not exceed 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    strongPassword("password"),
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),

    validate,
  ],

  login: [
    body("identifier").trim().notEmpty().withMessage("identifier (email / studentId) is required"),
    body("password").notEmpty().withMessage("password is required"),
    validate,
  ],

  updateProfile: [
    body("username")
      .custom((value) => value === undefined)
      .withMessage("Username cannot be changed from your profile"),
    body("firstName").optional().trim(),
    body("lastName").optional().trim(),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Valid email is required")
      .bail()
      .normalizeEmail(),
    body("studentId")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 50 })
      .withMessage("Student ID must not exceed 50 characters"),
    validate,
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    strongPassword("newPassword"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("New passwords do not match"),
    validate,
  ],

  resetPassword: [
    body("resetToken").notEmpty().withMessage("Reset token is required"),
    strongPassword("password"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match"),
    validate,
  ],
};

// User admin validation rules
const userRules = {
  create: [
    body("username")
      .trim()
      .toLowerCase()
      .notEmpty()
      .withMessage("username is required")
      .isLength({ max: 50 })
      .withMessage("username must not exceed 50 characters"),
    body("email").trim().isEmail().withMessage("valid email is required").normalizeEmail(),
    strongPassword("password"),
    body("studentId")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 50 })
      .withMessage("studentId must not exceed 50 characters"),
    body("roleIds").optional().isArray().withMessage("roleIds must be an array"),
    validate,
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("valid user id is required"),
    body("username")
      .optional()
      .trim()
      .toLowerCase()
      .notEmpty()
      .withMessage("username is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("username must be between 3 and 50 characters")
      .matches(/^\S+$/)
      .withMessage("username cannot contain spaces"),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("valid email is required")
      .normalizeEmail(),
    body("studentId")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 50 })
      .withMessage("studentId must not exceed 50 characters"),
    body("firstName").optional().trim(),
    body("lastName").optional().trim(),
    body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
    body("roleIds").optional().isArray().withMessage("roleIds must be an array"),
    validate,
  ],

  id: [
    param("id").isInt({ min: 1 }).withMessage("valid user id is required"),
    validate,
  ],

  assignRoles: [
    param("id").isInt({ min: 1 }).withMessage("valid user id is required"),
    body("roleIds").isArray({ min: 0 }).withMessage("roleIds must be an array"),
    validate,
  ],

  assignPermissions: [
    param("id").isInt({ min: 1 }).withMessage("valid user id is required"),
    body("permissionIds").isArray({ min: 0 }).withMessage("permissionIds must be an array"),
    validate,
  ],

  assignRolePermissions: [
    param("id").isInt({ min: 1 }).withMessage("valid role id is required"),
    body("permissionIds").isArray({ min: 0 }).withMessage("permissionIds must be an array"),
    validate,
  ],
};

// Role CRUD validation rules
const roleRules = {
  create: [
    body("name").trim().notEmpty().withMessage("role name is required"),
    body("description").optional().trim(),
    validate,
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("valid role id is required"),
    body("name").optional().trim().notEmpty().withMessage("name cannot be empty"),
    body("description").optional().trim(),
    validate,
  ],

  id: [
    param("id").isInt({ min: 1 }).withMessage("valid role id is required"),
    validate,
  ],

  assignPermissions: [
    param("id").isInt({ min: 1 }).withMessage("valid role id is required"),
    body("permissionIds").isArray({ min: 0 }).withMessage("permissionIds must be an array"),
    validate,
  ],
};

// Permission validation rules
const permissionRules = {
  create: [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("description").optional().trim(),
    validate,
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("valid permission id is required"),
    body("name").optional().trim().notEmpty().withMessage("name cannot be empty"),
    body("description").optional().trim(),
    validate,
  ],

  id: [
    param("id").isInt({ min: 1 }).withMessage("valid permission id is required"),
    validate,
  ],

  assignRoles: [
    param("id").isInt({ min: 1 }).withMessage("valid permission id is required"),
    body("roleIds").isArray({ min: 0 }).withMessage("roleIds must be an array"),
    validate,
  ],
};

// Query validation
const queryValidation = {
  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    validate,
  ],

  search: [
    query("q")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Search query must be at least 2 characters"),
    validate,
  ],
};

// ID parameter validation
const idValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid ID is required"),
  validate,
];

module.exports = {
  validate,
  userValidation,
  userRules,
  roleRules,
  permissionRules,
  queryValidation,
  idValidation,
};
