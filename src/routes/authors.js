// routes/authors.js
const router = require('express').Router();
const AuthorController = require('../controllers/authorController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/', AuthorController.getAll);
router.get('/:id', AuthorController.getById);
router.post('/', authenticate, requirePermission('books.create'), AuthorController.create);
router.put('/:id', authenticate, requirePermission('books.update'), AuthorController.update);
router.delete('/:id', authenticate, requirePermission('books.delete'), AuthorController.delete);

module.exports = router;