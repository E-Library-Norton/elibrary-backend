// models/Review.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define(
  'Review',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    bookId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'book_id',
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'user_id',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_deleted',
    },
  },
  {
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['book_id', 'is_deleted'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = Review;
