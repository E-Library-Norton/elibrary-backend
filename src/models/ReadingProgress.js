const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ReadingProgress = sequelize.define(
  "ReadingProgress",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "user_id",
    },
    bookId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "book_id",
    },
    currentPage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "current_page",
      validate: { min: 1 },
    },
    totalPages: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "total_pages",
      validate: { min: 1 },
    },
    progressPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "progress_percentage",
      get() {
        const value = this.getDataValue("progressPercentage");
        return value === null ? null : Number(value);
      },
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "last_read_at",
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "completed_at",
    },
  },
  {
    tableName: "reading_progress",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "reading_progress_user_book_unique",
        unique: true,
        fields: ["user_id", "book_id"],
      },
      { fields: ["user_id", "last_read_at"] },
      { fields: ["book_id"] },
    ],
  }
);

module.exports = ReadingProgress;
