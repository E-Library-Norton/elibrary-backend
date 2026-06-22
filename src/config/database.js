const { Sequelize } = require("sequelize");
require("dotenv").config({ path: ['.env.local', '.env'] });

// DB_SSL=false disables SSL (for local Docker where containers talk plaintext).
// Default: SSL enabled (for Render managed DB / any external SSL DB).
const useSSL = (process.env.DB_SSL ?? 'true').toLowerCase() !== 'false';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  pool: {
    max: 20,    // max connections in pool
    min: 5,     // min connections kept alive
    acquire: 30000, // 30s to acquire before error
    idle: 10000, // 10s idle before release
  },
  ...(useSSL && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // important for Render
      },
    },
  }),
});

module.exports = { sequelize };
