const { Sequelize } = require("sequelize");
require("dotenv").config({ path: ['.env.local', '.env'] });

// DB_SSL=false disables SSL (for local Docker where containers talk plaintext).
// Default: SSL enabled (for Render managed DB / any external SSL DB).
const useSSL = (process.env.DB_SSL ?? 'true').toLowerCase() !== 'false';

if (!process.env.DATABASE_URL) {
  console.error(" Error: DATABASE_URL environment variable is not defined!");
  console.error(" Please ensure DATABASE_URL is configured in your production environment variables (e.g. Render Dashboard) or in your local config (.env.local / .env).");
  process.exit(1);
}

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
