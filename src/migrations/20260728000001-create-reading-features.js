"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "reading_progress",
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
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          book_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            references: { model: "books", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          current_page: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
          },
          total_pages: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          progress_percentage: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
          },
          last_read_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          completed_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        { transaction }
      );

      await queryInterface.addIndex(
        "reading_progress",
        ["user_id", "book_id"],
        {
          unique: true,
          name: "reading_progress_user_book_unique",
          transaction,
        }
      );
      await queryInterface.addIndex(
        "reading_progress",
        ["user_id", "last_read_at"],
        { name: "reading_progress_user_last_read", transaction }
      );
      await queryInterface.addIndex("reading_progress", ["book_id"], {
        name: "reading_progress_book_id",
        transaction,
      });
      await queryInterface.addConstraint("reading_progress", {
        fields: ["current_page"],
        type: "check",
        where: { current_page: { [Sequelize.Op.gte]: 1 } },
        name: "reading_progress_current_page_positive",
        transaction,
      });
      await queryInterface.addConstraint("reading_progress", {
        fields: ["total_pages"],
        type: "check",
        where: { total_pages: { [Sequelize.Op.gte]: 1 } },
        name: "reading_progress_total_pages_positive",
        transaction,
      });
      await queryInterface.sequelize.query(
        `ALTER TABLE "reading_progress"
         ADD CONSTRAINT "reading_progress_current_within_total"
         CHECK ("current_page" <= "total_pages")`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "reading_progress"
         ADD CONSTRAINT "reading_progress_percentage_range"
         CHECK ("progress_percentage" >= 0 AND "progress_percentage" <= 100)`,
        { transaction }
      );

      await queryInterface.createTable(
        "bookmarks",
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
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          book_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            references: { model: "books", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          page_number: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          title: {
            type: Sequelize.STRING(160),
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        { transaction }
      );

      await queryInterface.addIndex(
        "bookmarks",
        ["user_id", "book_id", "page_number"],
        {
          unique: true,
          name: "bookmarks_user_book_page_unique",
          transaction,
        }
      );
      await queryInterface.addIndex(
        "bookmarks",
        ["user_id", "book_id", "created_at"],
        { name: "bookmarks_user_book_created", transaction }
      );
      await queryInterface.addIndex("bookmarks", ["book_id"], {
        name: "bookmarks_book_id",
        transaction,
      });
      await queryInterface.addConstraint("bookmarks", {
        fields: ["page_number"],
        type: "check",
        where: { page_number: { [Sequelize.Op.gte]: 1 } },
        name: "bookmarks_page_number_positive",
        transaction,
      });

      await queryInterface.createTable(
        "reading_notes",
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
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          book_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            references: { model: "books", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          page_number: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          selected_text: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          note_text: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          highlight_color: {
            type: Sequelize.STRING(32),
            allowNull: false,
            defaultValue: "yellow",
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        { transaction }
      );

      await queryInterface.addIndex(
        "reading_notes",
        ["user_id", "book_id", "page_number"],
        { name: "reading_notes_user_book_page", transaction }
      );
      await queryInterface.addIndex("reading_notes", ["book_id"], {
        name: "reading_notes_book_id",
        transaction,
      });
      await queryInterface.addConstraint("reading_notes", {
        fields: ["page_number"],
        type: "check",
        where: { page_number: { [Sequelize.Op.gte]: 1 } },
        name: "reading_notes_page_number_positive",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("reading_notes", { transaction });
      await queryInterface.dropTable("bookmarks", { transaction });
      await queryInterface.dropTable("reading_progress", { transaction });
    });
  },
};
