// routes/publishers.js
const router               = require('express').Router();
const PublisherController  = require('../controllers/publisherController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get ('/',     PublisherController.getAll);
router.get ('/:id',  PublisherController.getById);
router.post('/',     authenticate, requirePermission('books.create'), PublisherController.create);
router.put ('/:id',  authenticate, requirePermission('books.update'), PublisherController.update);
router.delete('/:id',authenticate, requirePermission('books.delete'), PublisherController.delete);

module.exports = router;