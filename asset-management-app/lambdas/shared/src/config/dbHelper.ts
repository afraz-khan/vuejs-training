import { sequelize } from '../models'
import { getDbCredentials, env } from './env'
import type { Sequelize } from 'sequelize'

/**
 * Database Connection Helper
 * Manages Sequelize connection lifecycle for Lambda functions
 */

let isConnected = false
let credentialsInitialized = false

/**
 * Initialize database credentials from Secrets Manager (production only)
 * Must be called before first connection
 */
async function initializeCredentials(): Promise<void> {
  if (credentialsInitialized) {
    return
  }

  if (env.NODE_ENV === 'production' && env.DB_SECRET_NAME) {
    console.log('🔐 Fetching credentials from Secrets Manager...')
    const credentials = await getDbCredentials()
    
    // Update Sequelize config directly
    // @ts-ignore - accessing internal config
    sequelize.config.password = credentials.password
    // @ts-ignore - accessing internal connectionManager
    if (sequelize.connectionManager) {
      // @ts-ignore
      sequelize.connectionManager.config.password = credentials.password
    }
    
    // Also update process.env for consistency
    process.env.DB_PASSWORD = credentials.password
    
    credentialsInitialized = true
    console.log('✅ Credentials fetched and configured')
  } else {
    // Development mode - credentials already in env
    credentialsInitialized = true
  }
}

/**
 * Connect to database
 * Reuses existing connection if available (Lambda container reuse)
 * Fetches credentials from Secrets Manager in production on first call
 */
export async function connectToDatabase(): Promise<Sequelize> {
  try {
    // Fetch credentials from Secrets Manager if needed (production only, first time)
    await initializeCredentials()
    
    // If already connected, return existing connection
    if (isConnected) {
      console.log('♻️  Using existing database connection')
      return sequelize
    }

    console.log('🔌 Creating new database connection...')
    
    // Test the connection
    await sequelize.authenticate()
    isConnected = true
    console.log('✅ Database connection established')
    return sequelize
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Database connection failed: ${errorMessage}`)
  }
}

/**
 * Close database connection
 * Call this when Lambda is shutting down (rare)
 */
export async function closeDatabase(): Promise<void> {
  if (!isConnected) {
    return
  }

  try {
    await sequelize.close()
    isConnected = false
    console.log('Database connection closed')
  } catch (error) {
    console.error('Error closing database:', error)
    throw error
  }
}

/**
 * Test database connection
 * Useful for health checks
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await sequelize.authenticate()
    return { success: true, message: 'Connection successful' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get connection status
 */
export function isConnectionActive(): boolean {
  return isConnected
}
