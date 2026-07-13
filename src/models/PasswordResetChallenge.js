const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PasswordResetChallenge = sequelize.define(
  'PasswordResetChallenge',
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
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'token_hash',
    },
    otpHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'otp_hash',
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'used_at',
    },
  },
  {
    tableName: 'password_reset_challenges',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['user_id'] },
      { unique: true, fields: ['token_hash'] },
      { fields: ['expires_at'] },
    ],
  }
);

module.exports = PasswordResetChallenge;
