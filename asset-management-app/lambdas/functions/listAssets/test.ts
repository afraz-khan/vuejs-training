// Import env FIRST to load environment variables
import '../../shared/src/config/env'
import { handler } from './index'
import { handler as createHandler } from '../createAsset/index'
import type { APIGatewayProxyEvent } from 'aws-lambda'

async function testListAssets() {
  console.log('🧪 Testing List Assets Lambda\n')

  // Setup: Create multiple test assets
  console.log('Setup: Creating test assets...')
  const testAssets = [
    { ownerId: 'user-1', name: 'Asset 1', category: 'image' },
    { ownerId: 'user-1', name: 'Asset 2', category: 'document' },
    { ownerId: 'user-2', name: 'Asset 3', category: 'image' },
  ]

  for (const asset of testAssets) {
    const createEvent: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify(asset),
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
    await createHandler(createEvent as APIGatewayProxyEvent)
  }
  console.log('Created 3 test assets\n')

  // Test 1: List all assets
  console.log('Test 1: Listing all assets...')
  const listEvent: Partial<APIGatewayProxyEvent> = {
    queryStringParameters: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/assets',
    pathParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    body: null,
  }

  try {
    const result = await handler(listEvent as APIGatewayProxyEvent)
    console.log('Status:', result.statusCode)
    const response = JSON.parse(result.body)
    console.log('Total assets:', response.data.pagination.total)
    console.log('Returned:', response.data.assets.length)
    console.log('✅ Test 1 passed\n')
  } catch (error) {
    console.error('❌ Test 1 failed:', error)
  }

  // Test 2: Filter by owner
  console.log('Test 2: Filtering by owner...')
  const filterEvent: Partial<APIGatewayProxyEvent> = {
    ...listEvent,
    queryStringParameters: { ownerId: 'user-1' },
  }

  try {
    const result = await handler(filterEvent as APIGatewayProxyEvent)
    const response = JSON.parse(result.body)
    console.log('Assets for user-1:', response.data.assets.length)
    
    if (response.data.assets.every((a: any) => a.ownerId === 'user-1')) {
      console.log('✅ Test 2 passed (filtering works)\n')
    } else {
      console.log('❌ Test 2 failed (wrong owner)\n')
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error)
  }

  // Test 3: Pagination
  console.log('Test 3: Testing pagination...')
  const paginationEvent: Partial<APIGatewayProxyEvent> = {
    ...listEvent,
    queryStringParameters: { limit: '2', offset: '0' },
  }

  try {
    const result = await handler(paginationEvent as APIGatewayProxyEvent)
    const response = JSON.parse(result.body)
    console.log('Pagination:', response.data.pagination)
    
    if (response.data.assets.length <= 2) {
      console.log('✅ Test 3 passed (pagination works)\n')
    } else {
      console.log('❌ Test 3 failed (too many results)\n')
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error)
  }

  console.log('✨ All tests completed!')
  process.exit(0)
}

// Run tests
testListAssets()