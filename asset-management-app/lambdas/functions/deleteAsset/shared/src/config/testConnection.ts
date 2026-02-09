// Import env FIRST to ensure environment variables are loaded
import './env'
import { connectToDatabase, testConnection, closeDatabase, isConnectionActive } from './dbHelper'
import { Asset } from '../models'

async function runTests(): Promise<void> {
  console.log('🧪 Testing Database Connection Helper\n')

  try {
    // Test 1: Connect to database
    console.log('Test 1: Connecting to database...')
    await connectToDatabase()
    console.log('✅ Test 1 passed\n')

    // Test 2: Check connection status
    console.log('Test 2: Checking connection status...')
    const status = isConnectionActive()
    console.log('Connection active:', status)
    if (!status) {
      throw new Error('Connection should be active')
    }
    console.log('✅ Test 2 passed\n')

    // Test 3: Test connection
    console.log('Test 3: Testing connection...')
    const result = await testConnection()
    console.log('Result:', result)
    if (!result.success) {
      throw new Error('Connection test failed')
    }
    console.log('✅ Test 3 passed\n')

    // Test 4: Query database
    console.log('Test 4: Querying database...')
    const count = await Asset.count()
    console.log(`Found ${count} assets in database`)
    console.log('✅ Test 4 passed\n')

    // Test 5: Connection reuse
    console.log('Test 5: Testing connection reuse...')
    await connectToDatabase() // Should reuse existing connection
    console.log('✅ Test 5 passed\n')

    console.log('✨ All tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await closeDatabase()
    console.log('\n👋 Connection closed')
  }
}

// Run tests
runTests()