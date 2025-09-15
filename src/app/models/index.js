import { Sequelize } from 'sequelize';
import config from '../../config/env.js';

const dbConfig = config.database;

export const sequelize = new Sequelize(
  dbConfig.database || 'database',
  dbConfig.username || 'username',
  dbConfig.password || 'password',
  {
    dialect: dbConfig.dialect,
    storage: dbConfig.storage,
    host: dbConfig.host,
    port: dbConfig.port,
    logging: dbConfig.logging,
  }
);

export default sequelize;

