'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // NOT VALID preserves legacy rows that may have no category while still
    // enforcing the rule for every new or updated row.
    await queryInterface.sequelize.query(`
      ALTER TABLE books
      ADD CONSTRAINT books_category_id_required
      CHECK (category_id IS NOT NULL) NOT VALID
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE books
      DROP CONSTRAINT IF EXISTS books_category_id_required
    `);
  },
};
