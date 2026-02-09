import { env, validateEnv } from './config/env'
import type { AssetAttributes, AssetCategory } from './types'

console.log('🚀 TypeScript setup test')
console.log('Environment:', env.NODE_ENV)
console.log('Database:', env.DB_NAME)

// Test type checking
const testAsset: AssetAttributes = {
  id: '123',
  ownerId: 'user-123',
  name: 'Test Asset',
  description: 'A test asset description',
  category: 'image' as AssetCategory,
  imageKey: 'test/image.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
}

console.log('✅ TypeScript is working!')
console.log('Test asset:', testAsset)

// Validate environment
try {
  validateEnv()
  console.log('✅ Environment variables validated')
} catch (error) {
  console.error('❌ Environment validation failed:', error)
}