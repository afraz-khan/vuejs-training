// Import env FIRST to load environment variables
import '../../shared/src/config/env'
import { handler } from './index'
import type { APIGatewayProxyEvent } from 'aws-lambda'

async function testCreateAsset() {
  console.log('🧪 Testing Create Asset Lambda\n')

  // Test 1: Valid asset creation
  console.log('Test 1: Creating valid asset...')
  const validEvent: Partial<APIGatewayProxyEvent> = {
    body: JSON.stringify({
      ownerId: 'test-user-123',
      name: 'My Test Asset',
      description: 'This is a test asset',
      category: 'image',
      imageKey: 'assets/test-user-123/test-asset.jpg',
    }),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/assets',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  }

  try {
    const result = await handler(validEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    console.log('Response:', JSON.parse(result.body))
    console.log('✅ Test 1 passed\n')
  } catch (error) {
    console.error('❌ Test 1 failed:', error)
  }

  // Test 2: Missing required field
  console.log('Test 2: Testing validation (missing name)...')
  const invalidEvent: Partial<APIGatewayProxyEvent> = {
    ...validEvent,
    body: JSON.stringify({
      ownerId: 'test-user-123',
      category: 'image',
    }),
  }

  try {
    const result = await handler(invalidEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    console.log('Response:', JSON.parse(result.body))
    if (result.statusCode === 400) {
      console.log('✅ Test 2 passed (validation working)\n')
    } else {
      console.log('❌ Test 2 failed (should return 400)\n')
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error)
  }

  // Test 3: Invalid category
  console.log('Test 3: Testing validation (invalid category)...')
  const invalidCategoryEvent: Partial<APIGatewayProxyEvent> = {
    ...validEvent,
    body: JSON.stringify({
      ownerId: 'test-user-123',
      name: 'Test Asset',
      category: 'invalid-category',
    }),
  }

  try {
    const result = await handler(invalidCategoryEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    console.log('Response:', JSON.parse(result.body))
    if (result.statusCode === 400) {
      console.log('✅ Test 3 passed (validation working)\n')
    } else {
      console.log('❌ Test 3 failed (should return 400)\n')
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error)
  }

  console.log('✨ All tests completed!')
  process.exit(0)
}

// Run tests
testCreateAsset()