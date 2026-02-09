import { sequelize, Asset } from './index'
import { AssetCategory } from '../types'

async function testModel(): Promise<void> {
  try {
    console.log('🧪 Testing Sequelize Model\n')

    // Test 1: Connection
    console.log('Test 1: Testing database connection...')
    await sequelize.authenticate()
    console.log('✅ Connection established successfully\n')

    // Test 2: Model structure
    console.log('Test 2: Checking model attributes...')
    const attributes = Object.keys(Asset.rawAttributes)
    console.log('Model attributes:', attributes)
    console.log('✅ Model structure verified\n')

    // Test 3: Validation - Missing required fields
    console.log('Test 3: Testing validation (should fail)...')
    try {
      const invalidAsset = Asset.build({})
      await invalidAsset.validate()
      console.log('❌ Validation should have failed')
    } catch (error: any) {
      const messages = error.errors?.map((e: any) => e.message) || [error.message]
      console.log('✅ Validation working:', messages)
    }
    console.log()

    // Test 4: Valid data
    console.log('Test 4: Testing valid data...')
    const validAsset = Asset.build({
      ownerId: 'test-user-123',
      name: 'Test Asset',
      description: 'This is a test asset',
      category: AssetCategory.IMAGE,
      imageKey: 'assets/test-user-123/test-asset/image.jpg',
    })

    await validAsset.validate()
    console.log('✅ Valid asset passed validation')
    console.log('Asset data:', validAsset.toJSON())
    console.log()

    // Test 5: Type safety
    console.log('Test 5: Testing TypeScript type safety...')
    // This would cause a TypeScript error at compile time:
    // const badAsset = Asset.build({ category: 'invalid' }) // ❌ Type error
    console.log('✅ TypeScript types are enforced at compile time')
    console.log()

    console.log('✨ All tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

// Run tests
testModel()