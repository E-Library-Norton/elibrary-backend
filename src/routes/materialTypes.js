// routes/materialTypes.js
const router = require('express').Router();
const MaterialTypeController = require('../controllers/materialTypeController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/', MaterialTypeController.getAll);
router.get('/:id', MaterialTypeController.getById);
router.post('/', authenticate, requirePermission('books.create'), MaterialTypeController.create);
router.put('/:id', authenticate, requirePermission('books.update'), MaterialTypeController.update);
router.delete('/:id', authenticate, requirePermission('books.delete'), MaterialTypeController.delete);

module.exports = router;