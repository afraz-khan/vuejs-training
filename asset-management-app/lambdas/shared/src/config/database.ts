import { Options } from 'sequelize'
import { env } from './env'
import type { DatabaseConfig } from '../types'

/**
 * Get Sequelize configuration based on environment
 */
export function getDatabaseConfig(): Options {
  const baseConfig: Options = {
    dialect: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    logging: env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: env.DB_POOL_MAX,
      min: env.DB_POOL_MIN,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    },
  }

  return baseConfig
}

export default getDatabaseConfig()