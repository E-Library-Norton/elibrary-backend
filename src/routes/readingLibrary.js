const router = require("express").Router();
const ReadingController = require("../controllers/readingController");
const { authenticate } = require("../middleware/auth");

router.get("/reading-progress", authenticate, ReadingController.getLibrary);

module.exports = router;
