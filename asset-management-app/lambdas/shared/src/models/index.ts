import { Sequelize } from 'sequelize'
import { getDatabaseConfig } from '../config/database'
import { defineAssetModel, AssetModel } from './Asset'
import { env } from '../config/env'

// Create Sequelize instance
const sequelize = new Sequelize(getDatabaseConfig())

// Initialize models
const Asset: AssetModel = defineAssetModel(sequelize)

// Sync models in development (optional)
if (env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true') {
  sequelize
    .sync({ alter: true })
    .then(() => {
      console.log('✅ Database synced')
    })
    .catch((error: Error) => {
      console.error('❌ Database sync failed:', error)
    })
}

// Export sequelize instance and models
export { sequelize, Sequelize, Asset }

// Export types
export type { AssetModel }