const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Bookmark = sequelize.define(
  "Bookmark",
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
    pageNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "page_number",
      validate: { min: 1 },
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
  },
  {
    tableName: "bookmarks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "bookmarks_user_book_page_unique",
        unique: true,
        fields: ["user_id", "book_id", "page_number"],
      },
      { fields: ["user_id", "book_id", "created_at"] },
      { fields: ["book_id"] },
    ],
  }
);

module.exports = Bookmark;
