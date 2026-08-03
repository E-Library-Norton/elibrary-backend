const router = require('express').Router();
const PreferenceController = require('../controllers/preferenceController');
const { authenticate } = require('../middleware/auth');
const { preferenceRules } = require('../middleware/preferenceValidation');

router.get('/preferences', authenticate, PreferenceController.get);
router.post(
  '/preferences',
  authenticate,
  preferenceRules.save,
  PreferenceController.save
);
router.patch(
  '/preferences',
  authenticate,
  preferenceRules.save,
  PreferenceController.update
);

module.exports = router;
