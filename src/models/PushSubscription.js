// models/PushSubscription.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PushSubscription = sequelize.define(
  'PushSubscription',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true,        // null = anonymous / not logged-in user
      field: 'user_id',
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    keys: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '{ p256dh, auth }',
    },
  },
  {
    tableName: 'push_subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = PushSubscription;
