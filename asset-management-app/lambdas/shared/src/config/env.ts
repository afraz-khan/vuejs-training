import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env file
// Try multiple locations to find .env
const possiblePaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '../../.env'),
  path.join(__dirname, '../../../.env'),
]

let loaded = false
for (const envPath of possiblePaths) {
  const result = dotenv.config({ path: envPath })
  if (!result.error) {
    console.log('� Loading .env from:', envPath)
    console.log('✅ .env file loaded successfully')
    loaded = true
    break
  }
}

if (!loaded) {
  console.warn('⚠️  Warning: Could not load .env file from any location')
  console.log('💡 Trying default .env location...')
  dotenv.config() // Fallback to default behavior
}

/**
 * Type-safe environment variables
 */
export const env = {
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306'),
  DB_NAME: process.env.DB_NAME || '',
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  
  // AWS
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  DB_SECRET_NAME: process.env.DB_SECRET_NAME || '',
  
  // Environment
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  
  // Database Pool
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '5'),
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN || '0'),
} as const

// Debug: Log loaded environment variables (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment loaded:')
  console.log('  DB_HOST:', env.DB_HOST)
  console.log('  DB_PORT:', env.DB_PORT)
  console.log('  DB_NAME:', env.DB_NAME)
  console.log('  DB_USER:', env.DB_USER)
  console.log('  DB_PASSWORD:', env.DB_PASSWORD ? '***' : '(empty)')
  console.log()
}

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER']
  const missing = required.filter((key) => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}