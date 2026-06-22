// routes/editors.js
const router = require('express').Router();
const EditorController = require('../controllers/editorController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/', EditorController.getAll);
router.get('/:id', EditorController.getById);
router.post('/', authenticate, requirePermission('books.create'), EditorController.create);
router.put('/:id', authenticate, requirePermission('books.update'), EditorController.update);
router.delete('/:id', authenticate, requirePermission('books.delete'), EditorController.delete);

module.exports = router;
