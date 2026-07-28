const { body, param } = require("express-validator");
const { validate } = require("./validation");

const bookIdRule = param("bookId")
  .isInt({ min: 1 })
  .withMessage("A valid book ID is required");

const bookmarkIdRule = param("bookmarkId")
  .isInt({ min: 1 })
  .withMessage("A valid bookmark ID is required");

const noteIdRule = param("noteId")
  .isInt({ min: 1 })
  .withMessage("A valid note ID is required");

const pageRule = body("pageNumber")
  .isInt({ min: 1, max: 1000000 })
  .withMessage("Page number must be a positive integer");

const readingRules = {
  book: [bookIdRule, validate],

  updateProgress: [
    bookIdRule,
    body("currentPage")
      .isInt({ min: 1, max: 1000000 })
      .withMessage("Current page must be a positive integer"),
    body("totalPages")
      .isInt({ min: 1, max: 1000000 })
      .withMessage("Total pages must be a positive integer"),
    body().custom(({ currentPage, totalPages }) => {
      if (Number(currentPage) > Number(totalPages)) {
        throw new Error("Current page cannot exceed total pages");
      }
      return true;
    }),
    validate,
  ],

  createBookmark: [
    bookIdRule,
    pageRule,
    body("title")
      .optional({ nullable: true })
      .isString()
      .withMessage("Bookmark title must be text")
      .bail()
      .trim()
      .isLength({ max: 160 })
      .withMessage("Bookmark title must not exceed 160 characters"),
    validate,
  ],

  deleteBookmark: [bookIdRule, bookmarkIdRule, validate],

  createNote: [
    bookIdRule,
    pageRule,
    body("selectedText")
      .isString()
      .withMessage("Selected text is required")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("Selected text is required")
      .isLength({ max: 20000 })
      .withMessage("Selected text must not exceed 20,000 characters"),
    body("noteText")
      .optional({ nullable: true })
      .isString()
      .withMessage("Note must be text")
      .bail()
      .isLength({ max: 50000 })
      .withMessage("Note must not exceed 50,000 characters"),
    body("highlightColor")
      .optional()
      .isIn(["yellow", "green", "blue", "pink", "purple"])
      .withMessage("Invalid highlight color"),
    validate,
  ],

  updateNote: [
    bookIdRule,
    noteIdRule,
    body("noteText")
      .optional({ nullable: true })
      .isString()
      .withMessage("Note must be text")
      .bail()
      .isLength({ max: 50000 })
      .withMessage("Note must not exceed 50,000 characters"),
    body("highlightColor")
      .optional()
      .isIn(["yellow", "green", "blue", "pink", "purple"])
      .withMessage("Invalid highlight color"),
    body().custom((value) => {
      if (
        value.noteText === undefined &&
        value.highlightColor === undefined
      ) {
        throw new Error("Provide a note or highlight color to update");
      }
      return true;
    }),
    validate,
  ],

  deleteNote: [bookIdRule, noteIdRule, validate],
};

module.exports = readingRules;
