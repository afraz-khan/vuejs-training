// Import env FIRST to load environment variables
import '../../shared/src/config/env'
import { handler } from './index'
import { handler as createHandler } from '../createAsset/index'
import { handler as getHandler } from '../getAsset/index'
import type { APIGatewayProxyEvent } from 'aws-lambda'

async function testUpdateAsset() {
  console.log('🧪 Testing Update Asset Lambda\n')

  // Setup: Create a test asset
  console.log('Setup: Creating test asset...')
  const createEvent: Partial<APIGatewayProxyEvent> = {
    body: JSON.stringify({
      ownerId: 'test-user-789',
      name: 'Original Name',
      description: 'Original description',
      category: 'image',
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

  // Test 1: Update asset name
  console.log('Test 1: Updating asset name...')
  const updateEvent: Partial<APIGatewayProxyEvent> = {
    pathParameters: { id: createdAsset.id },
    body: JSON.stringify({
      name: 'Updated Name',
    }),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'PATCH',
    isBase64Encoded: false,
    path: `/assets/${createdAsset.id}`,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  }

  try {
    const result = await handler(updateEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    const response = JSON.parse(result.body)
    console.log('Updated name:', response.data.name)
    
    if (result.statusCode === 200 && response.data.name === 'Updated Name') {
      console.log('✅ Test 1 passed\n')
    } else {
      console.log('❌ Test 1 failed\n')
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error)
  }

  // Test 2: Update multiple fields
  console.log('Test 2: Updating multiple fields...')
  const multiUpdateEvent: Partial<APIGatewayProxyEvent> = {
    ...updateEvent,
    body: JSON.stringify({
      name: 'New Name',
      description: 'New description',
      category: 'document',
    }),
  }

  try {
    const result = await handler(multiUpdateEvent as APIGatewayProxyEvent)
    const response = JSON.parse(result.body)
    console.log('Updated fields:', {
      name: response.data.name,
      category: response.data.category,
    })
    
    if (response.data.name === 'New Name' && response.data.category === 'document') {
      console.log('✅ Test 2 passed\n')
    } else {
      console.log('❌ Test 2 failed\n')
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error)
  }

  // Test 3: Try to update ownerId (should fail)
  console.log('Test 3: Attempting to update ownerId (should fail)...')
  const ownerUpdateEvent: Partial<APIGatewayProxyEvent> = {
    ...updateEvent,
    body: JSON.stringify({
      ownerId: 'different-user',
    }),
  }

  try {
    const result = await handler(ownerUpdateEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    console.log('Response:', JSON.parse(result.body))
    
    if (result.statusCode === 400) {
      console.log('✅ Test 3 passed (ownerId change prevented)\n')
    } else {
      console.log('❌ Test 3 failed (should return 400)\n')
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error)
  }

  // Test 4: Update non-existent asset
  console.log('Test 4: Updating non-existent asset...')
  const notFoundEvent: Partial<APIGatewayProxyEvent> = {
    ...updateEvent,
    pathParameters: { id: '00000000-0000-0000-0000-000000000000' },
  }

  try {
    const result = await handler(notFoundEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    
    if (result.statusCode === 404) {
      console.log('✅ Test 4 passed (404 returned)\n')
    } else {
      console.log('❌ Test 4 failed (should return 404)\n')
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error)
  }

  // Test 5: Empty update body
  console.log('Test 5: Empty update body...')
  const emptyUpdateEvent: Partial<APIGatewayProxyEvent> = {
    ...updateEvent,
    body: JSON.stringify({}),
  }

  try {
    const result = await handler(emptyUpdateEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    
    if (result.statusCode === 400) {
      console.log('✅ Test 5 passed (validation working)\n')
    } else {
      console.log('❌ Test 5 failed (should return 400)\n')
    }
  } catch (error) {
    console.error('❌ Test 5 failed:', error)
  }

  console.log('✨ All tests completed!')
  process.exit(0)
}

// Run tests
testUpdateAsset()