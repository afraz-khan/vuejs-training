// Import env FIRST to load environment variables
import '../../shared/src/config/env'
import { handler } from './index'
import { handler as createHandler } from '../createAsset/index'
import type { APIGatewayProxyEvent } from 'aws-lambda'

async function testGetAsset() {
  console.log('🧪 Testing Get Asset Lambda\n')

  // First, create a test asset
  console.log('Setup: Creating test asset...')
  const createEvent: Partial<APIGatewayProxyEvent> = {
    body: JSON.stringify({
      ownerId: 'test-user-456',
      name: 'Test Asset for Get',
      description: 'This asset will be retrieved',
      category: 'document',
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

  const createResult = await createHandler(createEvent as APIGatewayProxyEvent)
  const createdAsset = JSON.parse(createResult.body).data
  console.log('Created asset:', createdAsset.id)
  console.log()

  // Test 1: Get existing asset
  console.log('Test 1: Getting existing asset...')
  const getEvent: Partial<APIGatewayProxyEvent> = {
    pathParameters: { id: createdAsset.id },
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: `/assets/${createdAsset.id}`,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    body: null,
  }

  try {
    const result = await handler(getEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    const response = JSON.parse(result.body)
    console.log('Response:', response)
    
    if (result.statusCode === 200 && response.data.id === createdAsset.id) {
      console.log('✅ Test 1 passed\n')
    } else {
      console.log('❌ Test 1 failed\n')
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error)
  }

  // Test 2: Get non-existent asset
  console.log('Test 2: Getting non-existent asset...')
  const notFoundEvent: Partial<APIGatewayProxyEvent> = {
    ...getEvent,
    pathParameters: { id: '00000000-0000-0000-0000-000000000000' },
  }

  try {
    const result = await handler(notFoundEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    console.log('Response:', JSON.parse(result.body))
    
    if (result.statusCode === 404) {
      console.log('✅ Test 2 passed (404 returned)\n')
    } else {
      console.log('❌ Test 2 failed (should return 404)\n')
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error)
  }

  // Test 3: Missing asset ID
  console.log('Test 3: Missing asset ID...')
  const missingIdEvent: Partial<APIGatewayProxyEvent> = {
    ...getEvent,
    pathParameters: null,
  }

  try {
    const result = await handler(missingIdEvent as APIGatewayProxyEvent)
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
testGetAsset()