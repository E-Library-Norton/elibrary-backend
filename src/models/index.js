// models/index.js
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// ── Initialize all models (
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const Book = require('./Book');
const Author = require('./Author');
const Editor = require('./Editor');
const Category = require('./Category');
const Publisher = require('./Publisher');
const MaterialType = require('./MaterialType');
const Department = require('./Department');
const Download = require('./Download');
const Setting = require('./Setting');
const Activity = require('./Activity');
const Review = require('./Review');
const PushSubscription = require('./PushSubscription');
const Feedback = require('./Feedback');
const PasswordResetChallenge = require('./PasswordResetChallenge');

// ── Junction table models (all timestamps: false — these tables have NO created_at) ──
const UsersRoles = sequelize.define('UsersRoles', {
  user_id: { type: DataTypes.BIGINT, primaryKey: true },
  role_id: { type: DataTypes.BIGINT, primaryKey: true },
}, { tableName: 'users_roles', timestamps: false });

const RolesPermissions = sequelize.define('RolesPermissions', {
  role_id: { type: DataTypes.BIGINT, primaryKey: true },
  permission_id: { type: DataTypes.BIGINT, primaryKey: true },
}, { tableName: 'roles_permissions', timestamps: false });

const UsersPermissions = sequelize.define('UsersPermissions', {
  user_id: { type: DataTypes.BIGINT, primaryKey: true },
  permission_id: { type: DataTypes.BIGINT, primaryKey: true },
}, { tableName: 'users_permissions', timestamps: false });

const BookAuthor = sequelize.define('BookAuthor', {
  book_id: { type: DataTypes.BIGINT, primaryKey: true },
  author_id: { type: DataTypes.BIGINT, primaryKey: true },
  isPrimaryAuthor: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_primary_author',
  },
}, { tableName: 'books_authors', timestamps: false });

const BookEditor = sequelize.define('BookEditor', {
  book_id: { type: DataTypes.BIGINT, primaryKey: true },
  editor_id: { type: DataTypes.BIGINT, primaryKey: true },
}, { tableName: 'books_editors', timestamps: false });

const PublishersBooks = sequelize.define('PublishersBooks', {
  publisher_id: { type: DataTypes.BIGINT, primaryKey: true },
  book_id: { type: DataTypes.BIGINT, primaryKey: true },
}, { tableName: 'publishers_books', timestamps: false });

// Associations

// RBAC
User.belongsToMany(Role, { through: UsersRoles, foreignKey: 'user_id', otherKey: 'role_id', as: 'Roles', onDelete: 'CASCADE' });
Role.belongsToMany(User, { through: UsersRoles, foreignKey: 'role_id', otherKey: 'user_id', as: 'Users', onDelete: 'CASCADE' });

Role.belongsToMany(Permission, { through: RolesPermissions, foreignKey: 'role_id', otherKey: 'permission_id', as: 'Permissions', onDelete: 'CASCADE' });
Permission.belongsToMany(Role, { through: RolesPermissions, foreignKey: 'permission_id', otherKey: 'role_id', as: 'Roles', onDelete: 'CASCADE' });

User.belongsToMany(Permission, { through: UsersPermissions, foreignKey: 'user_id', otherKey: 'permission_id', as: 'Permissions', onDelete: 'CASCADE' });
Permission.belongsToMany(User, { through: UsersPermissions, foreignKey: 'permission_id', otherKey: 'user_id', as: 'Users', onDelete: 'CASCADE' });

// Book FKs
Book.belongsTo(Category, { foreignKey: 'category_id', as: 'Category', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Book.belongsTo(Publisher, { foreignKey: 'publisher_id', as: 'Publisher', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Book.belongsTo(Department, { foreignKey: 'department_id', as: 'Department', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Book.belongsTo(MaterialType, { foreignKey: 'type_id', as: 'MaterialType', onDelete: 'SET NULL', onUpdate: 'CASCADE' });

Category.hasMany(Book, { foreignKey: 'category_id', as: 'Books' });
Publisher.hasMany(Book, { foreignKey: 'publisher_id', as: 'Books' });
Department.hasMany(Book, { foreignKey: 'department_id', as: 'Books' });
MaterialType.hasMany(Book, { foreignKey: 'type_id', as: 'Books' });

// Book ↔ Author
Book.belongsToMany(Author, { through: BookAuthor, foreignKey: 'book_id', otherKey: 'author_id', as: 'Authors', onDelete: 'CASCADE' });
Author.belongsToMany(Book, { through: BookAuthor, foreignKey: 'author_id', otherKey: 'book_id', as: 'Books', onDelete: 'CASCADE' });

// Book ↔ Editor
Book.belongsToMany(Editor, { through: BookEditor, foreignKey: 'book_id', otherKey: 'editor_id', as: 'Editors', onDelete: 'CASCADE' });
Editor.belongsToMany(Book, { through: BookEditor, foreignKey: 'editor_id', otherKey: 'book_id', as: 'Books', onDelete: 'CASCADE' });

// Book ↔ Publisher (publishers_books)
Book.belongsToMany(Publisher, { through: PublishersBooks, foreignKey: 'book_id', otherKey: 'publisher_id', as: 'Publishers', onDelete: 'CASCADE' });
Publisher.belongsToMany(Book, { through: PublishersBooks, foreignKey: 'publisher_id', otherKey: 'book_id', as: 'PublishedBooks', onDelete: 'CASCADE' });

// Downloads
Download.belongsTo(User, { foreignKey: 'user_id', as: 'User', onDelete: 'CASCADE' });
Download.belongsTo(Book, { foreignKey: 'book_id', as: 'Book', onDelete: 'CASCADE' });
User.hasMany(Download, { foreignKey: 'user_id', as: 'Downloads' });
Book.hasMany(Download, { foreignKey: 'book_id', as: 'Downloads' });

// Activities
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'User', onDelete: 'SET NULL' });
User.hasMany(Activity, { foreignKey: 'user_id', as: 'Activities' });

// Reviews
Review.belongsTo(Book, { foreignKey: 'book_id', as: 'Book', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'User', onDelete: 'CASCADE' });
Book.hasMany(Review, { foreignKey: 'book_id', as: 'Reviews' });
User.hasMany(Review, { foreignKey: 'user_id', as: 'Reviews' });

// PushSubscriptions
PushSubscription.belongsTo(User, { foreignKey: 'user_id', as: 'User', onDelete: 'CASCADE' });
User.hasMany(PushSubscription, { foreignKey: 'user_id', as: 'PushSubscriptions' });

// Feedbacks
Feedback.belongsTo(User, { foreignKey: 'user_id', as: 'User', onDelete: 'SET NULL' });
Feedback.belongsTo(User, { foreignKey: 'resolved_by', as: 'Resolver', onDelete: 'SET NULL' });
User.hasMany(Feedback, { foreignKey: 'user_id', as: 'Feedbacks' });

// Password reset challenges
PasswordResetChallenge.belongsTo(User, { foreignKey: 'userId', as: 'User', onDelete: 'CASCADE' });
User.hasOne(PasswordResetChallenge, { foreignKey: 'userId', as: 'PasswordResetChallenge', onDelete: 'CASCADE' });

// ── Exports 
module.exports = {
  sequelize,
  User, Role, Permission, Setting, Activity,
  Book, Author, Editor, Category, Publisher, MaterialType, Department, Download,
  Review, PushSubscription, Feedback, PasswordResetChallenge,
  BookAuthor, BookEditor, PublishersBooks,
};
