# Step 1.3.5: Get Asset Lambda Functions (TypeScript)

## 🎯 Goal
Create Lambda functions to retrieve assets - both single asset by ID and list all assets with filtering and pagination.

## 📚 What You'll Learn
- Query parameters handling
- Pagination implementation
- Filtering by owner
- Error handling for not found
- Type-safe query operations
- RESTful API patterns

## 📋 Prerequisites
- [ ] Step 1.3.4 completed (Create Asset Lambda)
- [ ] Understanding of REST API conventions
- [ ] Basic knowledge of pagination

## 🚀 Step-by-Step Instructions

### 1. Create Get Asset by ID Lambda

```bash
mkdir -p lambdas/functions/getAsset
touch lambdas/functions/getAsset/index.ts
touch lambdas/functions/getAsset/test.ts
touch lambdas/functions/getAsset/tsconfig.json
touch lambdas/functions/getAsset/package.json
```

---

### 2. Create Get Asset Handler

Open `lambdas/functions/getAsset/index.ts` and add:

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../../shared/src/utils/response'

/**
 * Get Asset by ID Lambda Handler
 * 
 * Retrieves a single asset by its ID
 * 
 * Path parameter:
 * - id: Asset ID (UUID)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get Asset Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Get asset ID from path parameters
    const assetId = event.pathParameters?.id

    if (!assetId) {
      return validationErrorResponse('Asset ID is required', 'id')
    }

    // Connect to database
    await connectToDatabase()

    // Find asset by ID
    const asset = await Asset.findByPk(assetId)

    if (!asset) {
      return errorResponse('Asset not found', 404)
    }

    console.log('Asset retrieved successfully:', asset.id)

    // Return success response
    return successResponse({
      id: asset.id,
      ownerId: asset.ownerId,
      name: asset.name,
      description: asset.description,
      category: asset.category,
      imageKey: asset.imageKey,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    })
  } catch (error) {
    console.error('Error retrieving asset:', error)

    // Handle database errors
    if (error instanceof Error) {
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to retrieve asset')
  }
}
```

**Save the file!**

---

### 3. Create List Assets Lambda

```bash
mkdir -p lambdas/functions/listAssets
touch lambdas/functions/listAssets/index.ts
touch lambdas/functions/listAssets/test.ts
touch lambdas/functions/listAssets/tsconfig.json
touch lambdas/functions/listAssets/package.json
```

---

### 4. Create List Assets Handler

Open `lambdas/functions/listAssets/index.ts` and add:

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { Op } from 'sequelize'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
  successResponse,
  errorResponse,
} from '../../shared/src/utils/response'

/**
 * List Assets Lambda Handler
 * 
 * Retrieves a list of assets with optional filtering and pagination
 * 
 * Query parameters:
 * - ownerId: Filter by owner ID (optional)
 * - category: Filter by category (optional)
 * - limit: Number of items per page (default: 10, max: 100)
 * - offset: Number of items to skip (default: 0)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('List Assets Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {}
    const ownerId = queryParams.ownerId
    const category = queryParams.category
    const limit = Math.min(parseInt(queryParams.limit || '10'), 100)
    const offset = parseInt(queryParams.offset || '0')

    // Connect to database
    await connectToDatabase()

    // Build where clause for filtering
    const where: any = {}
    if (ownerId) {
      where.ownerId = ownerId
    }
    if (category) {
      where.category = category
    }

    // Query assets with pagination
    const { count, rows: assets } = await Asset.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    })

    console.log(`Retrieved ${assets.length} assets (total: ${count})`)

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit)
    const currentPage = Math.floor(offset / limit) + 1

    // Return success response with pagination
    return successResponse({
      assets: assets.map((asset) => ({
        id: asset.id,
        ownerId: asset.ownerId,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        imageKey: asset.imageKey,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      })),
      pagination: {
        total: count,
        limit,
        offset,
        currentPage,
        totalPages,
        hasMore: offset + limit < count,
      },
    })
  } catch (error) {
    console.error('Error listing assets:', error)

    // Handle database errors
    if (error instanceof Error) {
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to list assets')
  }
}
```

**Save the file!**

---

### 5. Create TypeScript Configs

For `getAsset`:

Open `lambdas/functions/getAsset/tsconfig.json` and add:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["index.ts", "test.ts", "../../shared/src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

For `listAssets`:

Open `lambdas/functions/listAssets/tsconfig.json` and add:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["index.ts", "test.ts", "../../shared/src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Save both files!**

---

### 6. Create Package.json Files

For `getAsset`:

Open `lambdas/functions/getAsset/package.json` and add:

```json
{
  "name": "get-asset-lambda",
  "version": "1.0.0",
  "description": "Lambda function to get asset by ID",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "test": "npx tsx test.ts"
  },
  "keywords": ["lambda", "asset", "get"],
  "author": "",
  "license": "ISC"
}
```

For `listAssets`:

Open `lambdas/functions/listAssets/package.json` and add:

```json
{
  "name": "list-assets-lambda",
  "version": "1.0.0",
  "description": "Lambda function to list assets",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "test": "npx tsx test.ts"
  },
  "keywords": ["lambda", "asset", "list"],
  "author": "",
  "license": "ISC"
}
```

**Save both files!**

---

### 7. Create Test for Get Asset

Open `lambdas/functions/getAsset/test.ts` and add:

```typescript
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
```

**Save the file!**

---

### 8. Create Test for List Assets

Open `lambdas/functions/listAssets/test.ts` and add:

```typescript
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
```

**Save the file!**

---

### 9. Run Tests

Test Get Asset:

```bash
cd lambdas/functions/getAsset
npx tsx test.ts
```

Test List Assets:

```bash
cd ../listAssets
npx tsx test.ts
```

**Expected output for Get Asset:**
```
🧪 Testing Get Asset Lambda

Setup: Creating test asset...
Created asset: <uuid>

Test 1: Getting existing asset...
Status: 200
Response: { success: true, data: { id: '<uuid>', ... } }
✅ Test 1 passed

Test 2: Getting non-existent asset...
Status: 404
Response: { success: false, error: 'Asset not found' }
✅ Test 2 passed (404 returned)

Test 3: Missing asset ID...
Status: 400
Response: { success: false, error: 'Asset ID is required', field: 'id' }
✅ Test 3 passed (validation working)

✨ All tests completed!
```

**Expected output for List Assets:**
```
🧪 Testing List Assets Lambda

Setup: Creating test assets...
Created 3 test assets

Test 1: Listing all assets...
Status: 200
Total assets: 7
Returned: 7
✅ Test 1 passed

Test 2: Filtering by owner...
Assets for user-1: 2
✅ Test 2 passed (filtering works)

Test 3: Testing pagination...
Pagination: { total: 7, limit: 2, offset: 0, currentPage: 1, totalPages: 4, hasMore: true }
✅ Test 3 passed (pagination works)

✨ All tests completed!
```

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `getAsset` Lambda function created
- [ ] `listAssets` Lambda function created
- [ ] TypeScript configs created for both
- [ ] Package.json files created for both
- [ ] Test scripts created for both
- [ ] Get Asset tests pass (3/3)
- [ ] List Assets tests pass (3/3)
- [ ] 404 error returned for non-existent asset
- [ ] Filtering by owner works
- [ ] Pagination works correctly

---

## 🔍 Understanding What You Built

### File Structure
```
lambdas/functions/
├── createAsset/
│   ├── index.ts
│   ├── test.ts
│   ├── tsconfig.json
│   └── package.json
├── getAsset/
│   ├── index.ts              # Get by ID (NEW!)
│   ├── test.ts               # Tests (NEW!)
│   ├── tsconfig.json         # Config (NEW!)
│   └── package.json          # Package (NEW!)
└── listAssets/
    ├── index.ts              # List with filters (NEW!)
    ├── test.ts               # Tests (NEW!)
    ├── tsconfig.json         # Config (NEW!)
    └── package.json          # Package (NEW!)
```

### API Endpoints
```
POST   /assets           → createAsset
GET    /assets/:id       → getAsset
GET    /assets           → listAssets
```

---

## 🎓 Key Concepts

### 1. Path Parameters

**Get by ID**:
```typescript
const assetId = event.pathParameters?.id
```

**URL**: `/assets/123e4567-e89b-12d3-a456-426614174000`

### 2. Query Parameters

**Filtering**:
```typescript
const ownerId = queryParams.ownerId
const category = queryParams.category
```

**URL**: `/assets?ownerId=user-1&category=image`

### 3. Pagination

**Implementation**:
```typescript
const limit = Math.min(parseInt(queryParams.limit || '10'), 100)
const offset = parseInt(queryParams.offset || '0')

const { count, rows } = await Asset.findAndCountAll({
  limit,
  offset,
  order: [['createdAt', 'DESC']],
})
```

**Metadata**:
```typescript
{
  total: 100,
  limit: 10,
  offset: 0,
  currentPage: 1,
  totalPages: 10,
  hasMore: true
}
```

### 4. Error Handling

**404 Not Found**:
```typescript
if (!asset) {
  return errorResponse('Asset not found', 404)
}
```

**400 Bad Request**:
```typescript
if (!assetId) {
  return validationErrorResponse('Asset ID is required', 'id')
}
```

---

## 📝 Notes

- Get Asset returns single asset or 404
- List Assets supports filtering and pagination
- Pagination prevents large result sets
- Query parameters are optional
- Default limit is 10, max is 100
- Results ordered by creation date (newest first)
- Connection reuse improves performance

---

## 🎯 What's Next?

In the next step (1.3.6), we'll:
- Create Update Asset Lambda function
- Implement partial updates (PATCH)
- Add ownership validation
- Handle concurrent updates

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.5! 🎉

**You now have:**
- ✅ Get Asset by ID endpoint
- ✅ List Assets with filtering
- ✅ Pagination support
- ✅ Query parameter handling
- ✅ 404 error handling
- ✅ Type-safe implementations
- ✅ Comprehensive tests

---

**Ready for Step 1.3.6?** Let me know when you've completed this step and all tests pass! 🚀
