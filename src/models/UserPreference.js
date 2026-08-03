const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserPreference = sequelize.define(
  'UserPreference',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id',
    },
    readingPurposes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'reading_purposes',
    },
    preferredCategoryIds: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'preferred_category_ids',
    },
    preferredLanguages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'preferred_languages',
    },
    onboardingCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'onboarding_completed',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    tableName: 'user_preferences',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['user_id'] },
      { fields: ['department_id'] },
      { fields: ['onboarding_completed'] },
    ],
  }
);

module.exports = UserPreference;
