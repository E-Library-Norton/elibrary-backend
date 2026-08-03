'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'user_preferences',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          user_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          department_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'departments', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          reading_purposes: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
          },
          preferred_category_ids: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
          },
          preferred_languages: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
          },
          onboarding_completed: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          completed_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction }
      );

      await queryInterface.addIndex('user_preferences', ['department_id'], {
        name: 'user_preferences_department_id',
        transaction,
      });
      await queryInterface.addIndex(
        'user_preferences',
        ['onboarding_completed'],
        {
          name: 'user_preferences_onboarding_completed',
          transaction,
        }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_preferences');
  },
};
