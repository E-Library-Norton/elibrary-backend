// routes/publishers.js
const router               = require('express').Router();
const PublisherController  = require('../controllers/publisherController');
router.get ('/',     PublisherController.getAll);
router.get ('/:id',  PublisherController.getById);
router.post('/',     PublisherController.create);
router.put ('/:id',  PublisherController.update);
router.delete('/:id',PublisherController.delete);

module.exports = router;