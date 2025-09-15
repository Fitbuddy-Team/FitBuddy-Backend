require('dotenv').config();

const common = {
  logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
};

const sqliteDefaults = {
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './dev.sqlite',
};

const connectionFromEnv = () => {
  const dialect = process.env.DB_DIALECT || 'sqlite';
  if (dialect === 'sqlite') {
    return { ...sqliteDefaults };
  }
  return {
    dialect,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME || 'fitbuddy_dev',
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || null,
  };
};

module.exports = {
  development: { ...connectionFromEnv(), ...common },
  test: { ...connectionFromEnv(), ...common, storage: process.env.DB_STORAGE_TEST || './test.sqlite' },
  production: { ...connectionFromEnv(), ...common },
};


