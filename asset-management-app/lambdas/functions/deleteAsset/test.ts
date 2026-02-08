// Import env FIRST to load environment variables
import '../../shared/src/config/env'
import { handler } from './index'
import { handler as createHandler } from '../createAsset/index'
import { handler as getHandler } from '../getAsset/index'
import type { APIGatewayProxyEvent } from 'aws-lambda'

async function testDeleteAsset() {
  console.log('🧪 Testing Delete Asset Lambda\n')

  // Setup: Create a test asset
  console.log('Setup: Creating test asset...')
  const createEvent: Partial<APIGatewayProxyEvent> = {
    body: JSON.stringify({
      ownerId: 'test-user-delete',
      name: 'Asset to Delete',
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

  // Test 1: Delete existing asset
  console.log('Test 1: Deleting existing asset...')
  const deleteEvent: Partial<APIGatewayProxyEvent> = {
    pathParameters: { id: createdAsset.id },
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'DELETE',
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
    const result = await handler(deleteEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    
    if (result.statusCode === 204) {
      console.log('✅ Test 1 passed (204 No Content)\n')
    } else {
      console.log('❌ Test 1 failed (should return 204)\n')
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error)
  }

  // Test 2: Verify asset is deleted
  console.log('Test 2: Verifying asset is deleted...')
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
    const result = await getHandler(getEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    
    if (result.statusCode === 404) {
      console.log('✅ Test 2 passed (asset not found)\n')
    } else {
      console.log('❌ Test 2 failed (asset should be deleted)\n')
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error)
  }

  // Test 3: Delete already deleted asset (idempotency)
  console.log('Test 3: Deleting already deleted asset (idempotency)...')
  try {
    const result = await handler(deleteEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    
    if (result.statusCode === 204) {
      console.log('✅ Test 3 passed (idempotent delete)\n')
    } else {
      console.log('❌ Test 3 failed (should return 204)\n')
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error)
  }

  // Test 4: Delete with missing ID
  console.log('Test 4: Deleting with missing ID...')
  const missingIdEvent: Partial<APIGatewayProxyEvent> = {
    ...deleteEvent,
    pathParameters: null,
  }

  try {
    const result = await handler(missingIdEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    
    if (result.statusCode === 400) {
      console.log('✅ Test 4 passed (validation working)\n')
    } else {
      console.log('❌ Test 4 failed (should return 400)\n')
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error)
  }

  console.log('✨ All tests completed!')
  process.exit(0)
}

// Run tests
testDeleteAsset()