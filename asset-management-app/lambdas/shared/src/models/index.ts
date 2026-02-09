import { Sequelize } from 'sequelize'
import { env } from '../config/env'
import { defineAssetModel, AssetModel } from './Asset'

// Create Sequelize instance with placeholder config
// Actual connection happens in dbHelper.connectToDatabase()
const sequelize = new Sequelize({
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
})

// Initialize models
const Asset: AssetModel = defineAssetModel(sequelize)

// Export sequelize instance and models
export { sequelize, Sequelize, Asset }

// Export types
export type { AssetModel }
