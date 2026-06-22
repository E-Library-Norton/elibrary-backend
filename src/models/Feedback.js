// models/Feedback.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define(
  'Feedback',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true,          // allow anonymous feedback
      field: 'user_id',
    },
    type: {
      type: DataTypes.ENUM('general', 'bug', 'feature', 'content', 'account'),
      allowNull: false,
      defaultValue: 'general',
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,          // filled for anonymous submissions
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,          // filled for anonymous submissions
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 },
    },
    status: {
      type: DataTypes.ENUM('new', 'reviewed', 'in_progress', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'new',
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes',
    },
    resolvedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'resolved_by',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
  },
  {
    tableName: 'feedbacks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = Feedback;
