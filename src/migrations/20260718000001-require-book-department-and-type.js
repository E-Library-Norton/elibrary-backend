'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // NOT VALID preserves legacy rows while enforcing both rules for every
    // newly inserted or updated book.
    await queryInterface.sequelize.query(`
      ALTER TABLE books
      ADD CONSTRAINT books_department_id_required
      CHECK (department_id IS NOT NULL) NOT VALID,
      ADD CONSTRAINT books_type_id_required
      CHECK (type_id IS NOT NULL) NOT VALID
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE books
      DROP CONSTRAINT IF EXISTS books_type_id_required,
      DROP CONSTRAINT IF EXISTS books_department_id_required
    `);
  },
};
