import { Options } from 'sequelize'
import { env, getDbCredentials } from './env'

/**
 * Get Sequelize configuration based on environment
 * Async to support Secrets Manager in production
 */
export async function getDatabaseConfig(): Promise<Options> {
  // Get credentials (from Secrets Manager in production, or env vars in development)
  const credentials = await getDbCredentials()
  
  const baseConfig: Options = {
    dialect: 'mysql',
    host: credentials.host,
    port: credentials.port,
    database: credentials.database,
    username: credentials.username,
    password: credentials.password,
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
