import { sequelize } from '../models'
import type { Sequelize } from 'sequelize'

/**
 * Database Connection Helper
 * Manages Sequelize connection lifecycle for Lambda functions
 */

let isConnected = false

/**
 * Connect to database
 * Reuses existing connection if available (Lambda container reuse)
 */
export async function connectToDatabase(): Promise<Sequelize> {
  if (isConnected) {
    console.log('Using existing database connection')
    return sequelize
  }

  try {
    console.log('Creating new database connection...')
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