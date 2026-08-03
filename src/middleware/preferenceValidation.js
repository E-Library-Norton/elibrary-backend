const { body, query } = require('express-validator');
const { validate } = require('./validation');

const READING_PURPOSES = [
  'daily_study',
  'assignment',
  'thesis',
  'research',
  'exam_preparation',
  'skill_development',
  'general_reading',
];
const PREFERRED_LANGUAGES = ['km', 'en', 'fr', 'other'];

const preferenceBodyRules = [
  body('departmentId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Department must be a valid ID'),
  body('readingPurposes')
    .isArray({ min: 1, max: READING_PURPOSES.length })
    .withMessage('Select at least one reading purpose'),
  body('readingPurposes.*')
    .isIn(READING_PURPOSES)
    .withMessage('Invalid reading purpose'),
  body('preferredCategoryIds')
    .isArray({ min: 1, max: 5 })
    .withMessage('Select between 1 and 5 categories'),
  body('preferredCategoryIds.*')
    .isInt({ min: 1 })
    .withMessage('Category IDs must be positive integers'),
  body('preferredLanguages')
    .isArray({ min: 1, max: PREFERRED_LANGUAGES.length })
    .withMessage('Select at least one preferred language'),
  body('preferredLanguages.*')
    .isIn(PREFERRED_LANGUAGES)
    .withMessage('Invalid preferred language'),
  body('onboardingCompleted')
    .optional()
    .isBoolean()
    .withMessage('onboardingCompleted must be a boolean'),
  body().custom((value) => {
    const uniquePurposes = new Set(value.readingPurposes || []);
    const uniqueCategories = new Set(
      (value.preferredCategoryIds || []).map(Number)
    );
    const uniqueLanguages = new Set(value.preferredLanguages || []);

    if (uniquePurposes.size !== (value.readingPurposes || []).length) {
      throw new Error('Reading purposes must be unique');
    }
    if (uniqueCategories.size !== (value.preferredCategoryIds || []).length) {
      throw new Error('Preferred categories must be unique');
    }
    if (uniqueLanguages.size !== (value.preferredLanguages || []).length) {
      throw new Error('Preferred languages must be unique');
    }
    return true;
  }),
  validate,
];

const preferenceRules = {
  save: preferenceBodyRules,
  recommendations: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    validate,
  ],
};

module.exports = { preferenceRules, READING_PURPOSES, PREFERRED_LANGUAGES };
