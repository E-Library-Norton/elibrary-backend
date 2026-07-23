// src/models/User.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue("username", value.trim().toLowerCase());
      },
    },
    email: {
      type: DataTypes.STRING(256),
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue("email", value.trim().toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING(256),
      allowNull: true,   // null for OAuth-only users
    },
    oauthProvider: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      field: 'oauth_provider',
    },
    oauthId: {
      type: DataTypes.STRING(256),
      allowNull: true,
      defaultValue: null,
      field: 'oauth_id',
    },
    studentId: {
      type: DataTypes.STRING(50),
      field: "student_id",
      unique: true,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.TEXT,
      field: "first_name",
      allowNull: true,
    },
    lastName: {
      type: DataTypes.TEXT,
      field: "last_name",
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_deleted",
    },
    // ── 2FA fields ──────────────────────────────────────────────────────
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "two_factor_enabled",
    },
    twoFactorSecret: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: "two_factor_secret",
    },
    faceDescriptor: {
      type: DataTypes.TEXT,          // JSON-encoded Float32Array (128 dims)
      allowNull: true,
      field: "face_descriptor",
    },
    recoveryCodes: {
      type: DataTypes.TEXT,          // JSON array of hashed recovery codes
      allowNull: true,
      field: "recovery_codes",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    // Automatically exclude soft-deleted users from every query
    defaultScope: {
      where: { isDeleted: false },
    },
  }
);

// ── Hooks 

User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// ── Instance methods 

// Never expose the hashed password in responses
User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.twoFactorSecret;
  delete values.faceDescriptor;
  delete values.recoveryCodes;
  return values;
};

// Compare plain-text password against the stored hash
User.prototype.validatePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Collect all permission names from roles + direct permissions
User.prototype.getRolesAndPermissions = async function () {
  const roles = await this.getRoles({ include: [{ association: "Permissions" }] });
  const directPermissions = await this.getPermissions();

  const rolePermNames = roles.flatMap((r) => (r.Permissions || []).map((p) => p.name));
  const directPermNames = directPermissions.map((p) => p.name);

  return {
    roles: roles.map((r) => r.name),
    permissions: [...new Set([...directPermNames, ...rolePermNames])],
  };
};

User.prototype.hasPermission = async function (permissionName) {
  const { permissions } = await this.getRolesAndPermissions();
  return permissions.includes(permissionName);
};

// ── Class methods 

// Login can be done with email, username, or studentId
User.findByLoginIdentifier = function (identifier) {
  const normalizedIdentifier =
    typeof identifier === "string" ? identifier.trim() : "";

  return this.findOne({
    where: {
      [Op.or]: [
        { email: { [Op.iLike]: normalizedIdentifier } },
        { username: { [Op.iLike]: normalizedIdentifier } },
        { studentId: normalizedIdentifier },
      ],
    },
  });
};

// ── Associations (called by models/index.js) 

User.associate = function (models) {
  // User.hasMany(models.RefreshToken, {
  //   foreignKey: "user_id",
  //   as: "refreshTokens",
  //   onDelete: "CASCADE",
  // });
  User.belongsToMany(models.Role, {
    through: "users_roles",
    foreignKey: "user_id",
    otherKey: "role_id",
    as: "Roles",
    timestamps: false,
  });
  User.belongsToMany(models.Permission, {
    through: "users_permissions",
    foreignKey: "user_id",
    otherKey: "permission_id",
    as: "Permissions",
    timestamps: false,
  });
};

module.exports = User;
