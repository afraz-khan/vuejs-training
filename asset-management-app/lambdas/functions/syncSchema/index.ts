import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { sequelize } from '../../shared/src/config/database'

/**
 * One-time Lambda to sync database schema
 * 
 * This creates all tables based on Sequelize models
 */
export const handler = async () => {
  console.log('🔄 Syncing database schema...')

  try {
    // Connect to database
    await connectToDatabase()
    console.log('✅ Connected to database')

    // Sync schema (creates tables if they don't exist)
    await sequelize.sync({ alter: true })
    console.log('✅ Schema synced successfully')

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Database schema synced successfully',
      }),
    }
  } catch (error) {
    console.error('❌ Schema sync failed:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}
