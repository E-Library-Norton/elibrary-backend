// src/models/Role.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Download = sequelize.define(
  "Download",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'user_id',
    },
    bookId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'book_id',
    },
    downloadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'downloaded_at',
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      field: 'ip_address',
    },
  },
  {
    tableName: "downloads",
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['book_id'] },
      { fields: ['downloaded_at'] },
    ],
  }
);

module.exports = Download;