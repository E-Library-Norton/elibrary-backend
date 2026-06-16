// src/config/sequelize-cli-config.js

require('dotenv').config({ path: ['.env.local', '.env'] });

// DB_SSL=false → no SSL (local Docker); default → SSL on (Render / external)
const useSSL = (process.env.DB_SSL ?? 'true').toLowerCase() !== 'false';

const sslOptions = useSSL
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : {};

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: sslOptions,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: sslOptions,
  },
};
