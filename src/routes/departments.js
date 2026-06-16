// routes/departments.js
const router = require('express').Router();
const DepartmentController = require('../controllers/departmentController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);
router.post('/', authenticate, requirePermission('books.create'), DepartmentController.create);
router.put('/:id', authenticate, requirePermission('books.update'), DepartmentController.update);
router.delete('/:id', authenticate, requirePermission('books.delete'), DepartmentController.delete);

module.exports = router;