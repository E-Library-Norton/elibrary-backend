const { Op, fn, col } = require('sequelize');
const {
  sequelize,
  UserPreference,
  Department,
  Category,
  Book,
  Author,
  Publisher,
  ReadingProgress,
  Review,
} = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

const PURPOSE_LABELS = {
  daily_study: 'Daily Study',
  assignment: 'Assignment',
  thesis: 'Thesis',
  research: 'Research',
  exam_preparation: 'Exam Preparation',
  skill_development: 'Skill Development',
  general_reading: 'General Reading',
};

const PURPOSE_KEYWORDS = {
  daily_study: ['introduction', 'fundamentals', 'principles', 'handbook'],
  assignment: ['practice', 'exercise', 'case study', 'workbook', 'guide'],
  thesis: ['thesis', 'academic writing', 'methodology', 'dissertation'],
  research: ['research', 'methodology', 'analysis', 'statistics'],
  exam_preparation: ['exam', 'review', 'questions', 'test', 'preparation'],
  skill_development: ['skills', 'practical', 'professional', 'advanced'],
  general_reading: ['overview', 'history', 'culture', 'society'],
};

const BOOK_INCLUDE = [
  { model: Category, as: 'Category', attributes: ['id', 'name', 'nameKh'] },
  { model: Department, as: 'Department', attributes: ['id', 'name', 'code'] },
  { model: Publisher, as: 'Publisher', attributes: ['id', 'name'] },
  {
    model: Author,
    as: 'Authors',
    attributes: ['id', 'name'],
    through: { attributes: [] },
  },
];

function uniqueNumbers(values) {
  return [...new Set(values.map(Number))];
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value).trim()))];
}

async function validateReferences(departmentId, categoryIds, transaction) {
  const [department, categoryCount] = await Promise.all([
    departmentId
      ? Department.findByPk(departmentId, {
          attributes: ['id'],
          transaction,
        })
      : Promise.resolve(null),
    Category.count({ where: { id: { [Op.in]: categoryIds } }, transaction }),
  ]);

  if (departmentId && !department) {
    throw new ValidationError('Selected department does not exist');
  }
  if (categoryCount !== categoryIds.length) {
    throw new ValidationError('One or more selected categories do not exist');
  }
}

async function serializePreference(preference) {
  if (!preference) return null;

  const data = preference.toJSON();
  const categories = await Category.findAll({
    where: { id: { [Op.in]: data.preferredCategoryIds } },
    attributes: ['id', 'name', 'nameKh'],
    order: [['name', 'ASC']],
  });

  return { ...data, Categories: categories };
}

function matchesReadingPurpose(book, purposes) {
  const text = [
    book.title,
    book.titleKh,
    book.description,
    book.Category?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return purposes.filter((purpose) =>
    (PURPOSE_KEYWORDS[purpose] || []).some((keyword) => text.includes(keyword))
  );
}

class PreferenceService {
  static async get(userId) {
    const preference = await UserPreference.findOne({
      where: { userId },
      include: [
        {
          model: Department,
          as: 'Department',
          attributes: ['id', 'name', 'nameKh', 'code'],
          required: false,
        },
      ],
    });

    return serializePreference(preference);
  }

  static async save(userId, values) {
    const readingPurposes = uniqueStrings(values.readingPurposes);
    const preferredCategoryIds = uniqueNumbers(values.preferredCategoryIds);
    const preferredLanguages = uniqueStrings(values.preferredLanguages);
    const departmentId = values.departmentId
      ? Number(values.departmentId)
      : null;

    const preference = await sequelize.transaction(async (transaction) => {
      await validateReferences(
        departmentId,
        preferredCategoryIds,
        transaction
      );

      const [record, created] = await UserPreference.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          departmentId,
          readingPurposes,
          preferredCategoryIds,
          preferredLanguages,
          onboardingCompleted: values.onboardingCompleted !== false,
          completedAt:
            values.onboardingCompleted === false ? null : new Date(),
        },
        transaction,
      });

      if (!created) {
        const completed = values.onboardingCompleted !== false;
        await record.update(
          {
            departmentId,
            readingPurposes,
            preferredCategoryIds,
            preferredLanguages,
            onboardingCompleted: completed,
            completedAt: completed ? record.completedAt || new Date() : null,
          },
          { transaction }
        );
      }

      return record;
    });

    return this.get(preference.userId);
  }

  static async recommendations(userId, { page = 1, limit = 12 } = {}) {
    const preference = await UserPreference.findOne({
      where: { userId, onboardingCompleted: true },
      include: [
        {
          model: Department,
          as: 'Department',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });

    if (!preference) {
      throw new NotFoundError('Complete your reading preferences first');
    }

    const categoryIds = uniqueNumbers(preference.preferredCategoryIds);
    const languages = uniqueStrings(preference.preferredLanguages).filter(
      (language) => language !== 'other'
    );
    const purposes = uniqueStrings(preference.readingPurposes);

    const progressRows = await ReadingProgress.findAll({
      where: { userId },
      attributes: ['bookId', 'progressPercentage'],
      include: [
        {
          model: Book,
          as: 'Book',
          attributes: ['id', 'categoryId'],
          required: true,
          where: { isDeleted: false },
          include: [
            {
              model: Author,
              as: 'Authors',
              attributes: ['id'],
              through: { attributes: [] },
              required: false,
            },
          ],
        },
      ],
    });

    const viewedCategoryIds = new Set(
      progressRows.map((row) => Number(row.Book?.categoryId)).filter(Boolean)
    );
    const viewedAuthorIds = new Set(
      progressRows.flatMap((row) =>
        (row.Book?.Authors || []).map((author) => Number(author.id))
      )
    );
    const completedBookIds = new Set(
      progressRows
        .filter((row) => Number(row.progressPercentage) >= 100)
        .map((row) => String(row.bookId))
    );

    const preferenceMatches = [];
    if (preference.departmentId) {
      preferenceMatches.push({ departmentId: preference.departmentId });
    }
    if (categoryIds.length) {
      preferenceMatches.push({ categoryId: { [Op.in]: categoryIds } });
    }
    if (languages.length) {
      preferenceMatches.push({ language: { [Op.in]: languages } });
    }

    const baseWhere = { isDeleted: false, isActive: true };
    const [matchedBooks, popularBooks] = await Promise.all([
      Book.findAll({
        where: {
          ...baseWhere,
          ...(preferenceMatches.length && { [Op.or]: preferenceMatches }),
        },
        include: BOOK_INCLUDE,
        order: [
          ['views', 'DESC'],
          ['downloads', 'DESC'],
          ['id', 'ASC'],
        ],
        limit: 400,
      }),
      Book.findAll({
        where: baseWhere,
        include: BOOK_INCLUDE,
        order: [
          ['views', 'DESC'],
          ['downloads', 'DESC'],
          ['id', 'ASC'],
        ],
        limit: 100,
      }),
    ]);

    const candidateMap = new Map();
    [...matchedBooks, ...popularBooks].forEach((book) =>
      candidateMap.set(String(book.id), book)
    );
    const candidates = [...candidateMap.values()];
    const candidateIds = candidates.map((book) => book.id);

    const ratingRows = candidateIds.length
      ? await Review.findAll({
          where: { bookId: { [Op.in]: candidateIds }, isDeleted: false },
          attributes: [
            'bookId',
            [fn('AVG', col('rating')), 'averageRating'],
            [fn('COUNT', col('id')), 'reviewCount'],
          ],
          group: ['bookId'],
          raw: true,
        })
      : [];
    const ratings = new Map(
      ratingRows.map((row) => [
        String(row.bookId),
        {
          averageRating: Number(row.averageRating || 0),
          reviewCount: Number(row.reviewCount || 0),
        },
      ])
    );

    const popularityValues = candidates
      .map((book) => Number(book.views || 0) + Number(book.downloads || 0) * 2)
      .sort((a, b) => b - a);
    const popularityThreshold =
      popularityValues[Math.floor(popularityValues.length * 0.25)] || Infinity;

    const scoredBooks = candidates
      .map((book) => {
        const data = book.toJSON();
        const reasons = [];
        let recommendationScore = 0;

        if (
          preference.departmentId &&
          Number(book.departmentId) === Number(preference.departmentId)
        ) {
          recommendationScore += 5;
          reasons.push('Matches your department');
        }
        if (categoryIds.includes(Number(book.categoryId))) {
          recommendationScore += 4;
          reasons.push('Matches your favorite category');
        }

        const matchedPurposes = matchesReadingPurpose(book, purposes);
        if (matchedPurposes.length) {
          recommendationScore += 3;
          reasons.push(
            `Useful for ${PURPOSE_LABELS[matchedPurposes[0]].toLowerCase()}`
          );
        }
        if (book.language && languages.includes(book.language)) {
          recommendationScore += 2;
          reasons.push('Available in your preferred language');
        }
        if (viewedCategoryIds.has(Number(book.categoryId))) {
          recommendationScore += 2;
          reasons.push('Related to your reading history');
        }
        if (
          (book.Authors || []).some((author) =>
            viewedAuthorIds.has(Number(author.id))
          )
        ) {
          recommendationScore += 2;
          reasons.push('By an author you have read');
        }

        const rating = ratings.get(String(book.id)) || {
          averageRating: 0,
          reviewCount: 0,
        };
        if (rating.averageRating >= 4 && rating.reviewCount > 0) {
          recommendationScore += 1;
          reasons.push('Highly rated by readers');
        }

        const popularity =
          Number(book.views || 0) + Number(book.downloads || 0) * 2;
        if (popularity >= popularityThreshold) {
          recommendationScore += 1;
          reasons.push('Popular in the library');
        }
        if (completedBookIds.has(String(book.id))) {
          recommendationScore -= 5;
          reasons.push('Already completed');
        }

        return {
          ...data,
          ...rating,
          recommendationScore,
          recommendationReasons: reasons,
        };
      })
      .filter((book) => book.recommendationScore > 0)
      .sort(
        (a, b) =>
          b.recommendationScore - a.recommendationScore ||
          Number(b.averageRating) - Number(a.averageRating) ||
          Number(b.views) - Number(a.views) ||
          Number(a.id) - Number(b.id)
      );

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(50, Math.max(1, Number(limit)));
    const offset = (pageNumber - 1) * pageSize;
    const categories = await Category.findAll({
      where: { id: { [Op.in]: categoryIds } },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    return {
      reason: {
        department: preference.Department?.name || 'Other',
        purposes: purposes.map((purpose) => PURPOSE_LABELS[purpose]),
        categories: categories.map((category) => category.name),
      },
      books: scoredBooks.slice(offset, offset + pageSize),
      total: scoredBooks.length,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(scoredBooks.length / pageSize),
    };
  }
}

module.exports = PreferenceService;
