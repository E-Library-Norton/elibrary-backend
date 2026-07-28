const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ReadingNote = sequelize.define(
  "ReadingNote",
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
    selectedText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "selected_text",
    },
    noteText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "note_text",
    },
    highlightColor: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "yellow",
      field: "highlight_color",
    },
  },
  {
    tableName: "reading_notes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["user_id", "book_id", "page_number"] },
      { fields: ["book_id"] },
    ],
  }
);

module.exports = ReadingNote;
