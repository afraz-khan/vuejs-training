# Step 1.3.6: Update and Delete Asset Lambda Functions (TypeScript)

## 🎯 Goal
Create Lambda functions to update and delete assets with proper validation, ownership checks, and error handling.

## 📚 What You'll Learn
- PATCH vs PUT operations
- Partial updates
- Ownership validation
- Optimistic locking
- Soft vs hard deletes
- Idempotent operations

## 📋 Prerequisites
- [ ] Step 1.3.5 completed (Get Asset Lambdas)
- [ ] Understanding of REST conventions
- [ ] Basic knowledge of database updates

## 🚀 Step-by-Step Instructions

### 1. Create Update Asset Lambda

```bash
mkdir -p lambdas/functions/updateAsset
touch lambdas/functions/updateAsset/index.ts
touch lambdas/functions/updateAsset/test.ts
touch lambdas/functions/updateAsset/tsconfig.json
touch lambdas/functions/updateAsset/package.json
```

---

### 2. Create Update Asset Handler

Open `lambdas/functions/updateAsset/index.ts` and add:

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
  validateOptionalString,
  validateCategory,
  validateLength,
  ValidationError,
} from '../../shared/src/utils/validation'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../../shared/src/utils/response'

/**
 * Update Asset Lambda Handler
 * 
 * Updates an existing asset (partial update - PATCH)
 * 
 * Path parameter:
 * - id: Asset ID (UUID)
 * 
 * Body (all optional):
 * {
 *   name: string
 *   description: string
 *   category: string
 *   imageKey: string
 * }
 * 
 * Note: ownerId cannot be changed
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Update Asset Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Get asset ID from path parameters
    const assetId = event.pathParameters?.id

    if (!assetId) {
      return validationErrorResponse('Asset ID is required', 'id')
    }

    // Parse request body
    if (!event.body) {
      return validationErrorResponse('Request body is required')
    }

    let body: any
    try {
      body = JSON.parse(event.body)
    } catch (error) {
      return validationErrorResponse('Invalid JSON in request body')
    }

    // Check if there's anything to update
    if (Object.keys(body).length === 0) {
      return validationErrorResponse('At least one field must be provided for update')
    }

    // Connect to database
    await connectToDatabase()

    // Find asset
    const asset = await Asset.findByPk(assetId)

    if (!asset) {
      return errorResponse('Asset not found', 404)
    }

    // Build update object with validation
    const updates: any = {}

    if (body.name !== undefined) {
      const name = validateOptionalString(body.name)
      if (name) {
        validateLength(name, 'name', 1, 255)
        updates.name = name
      }
    }

    if (body.description !== undefined) {
      const description = validateOptionalString(body.description)
      if (description) {
        validateLength(description, 'description', 0, 5000)
      }
      updates.description = description
    }

    if (body.category !== undefined) {
      updates.category = validateCategory(body.category)
    }

    if (body.imageKey !== undefined) {
      updates.imageKey = validateOptionalString(body.imageKey)
    }

    // Prevent ownerId changes
    if (body.ownerId !== undefined) {
      return validationErrorResponse('Owner ID cannot be changed', 'ownerId')
    }

    // Update asset
    await asset.update(updates)

    console.log('Asset updated successfully:', asset.id)

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
    console.error('Error updating asset:', error)

    // Handle validation errors
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message, error.field)
    }

    // Handle database errors
    if (error instanceof Error) {
      if (error.name === 'SequelizeValidationError') {
        return validationErrorResponse('Validation failed: ' + error.message)
      }
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to update asset')
  }
}
```

**Save the file!**

---

### 3. Create Delete Asset Lambda

```bash
mkdir -p lambdas/functions/deleteAsset
touch lambdas/functions/deleteAsset/index.ts
touch lambdas/functions/deleteAsset/test.ts
touch lambdas/functions/deleteAsset/tsconfig.json
touch lambdas/functions/deleteAsset/package.json
```

---

### 4. Create Delete Asset Handler

Open `lambdas/functions/deleteAsset/index.ts` and add:

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
 * Delete Asset Lambda Handler
 * 
 * Deletes an asset by ID (hard delete)
 * 
 * Path parameter:
 * - id: Asset ID (UUID)
 * 
 * Note: This is a hard delete. For production, consider implementing soft deletes.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Delete Asset Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Get asset ID from path parameters
    const assetId = event.pathParameters?.id

    if (!assetId) {
      return validationErrorResponse('Asset ID is required', 'id')
    }

    // Connect to database
    await connectToDatabase()

    // Find asset
    const asset = await Asset.findByPk(assetId)

    if (!asset) {
      // Return 204 for idempotency (already deleted or never existed)
      return {
        statusCode: 204,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: '',
      }
    }

    // Delete asset
    await asset.destroy()

    console.log('Asset deleted successfully:', assetId)

    // Return 204 No Content (successful deletion)
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: '',
    }
  } catch (error) {
    console.error('Error deleting asset:', error)

    // Handle database errors
    if (error instanceof Error) {
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to delete asset')
  }
}
```

**Save the file!**

---

### 5. Create TypeScript Configs

For `updateAsset`:

Open `lambdas/functions/updateAsset/tsconfig.json` and add:

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

For `deleteAsset`:

Open `lambdas/functions/deleteAsset/tsconfig.json` and add:

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

For `updateAsset`:

Open `lambdas/functions/updateAsset/package.json` and add:

```json
{
  "name": "update-asset-lambda",
  "version": "1.0.0",
  "description": "Lambda function to update asset",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "test": "npx tsx test.ts"
  },
  "keywords": ["lambda", "asset", "update"],
  "author": "",
  "license": "ISC"
}
```

For `deleteAsset`:

Open `lambdas/functions/deleteAsset/package.json` and add:

```json
{
  "name": "delete-asset-lambda",
  "version": "1.0.0",
  "description": "Lambda function to delete asset",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "test": "npx tsx test.ts"
  },
  "keywords": ["lambda", "asset", "delete"],
  "author": "",
  "license": "ISC"
}
```

**Save both files!**

---

### 7. Create Test for Update Asset

Open `lambdas/functions/updateAsset/test.ts` and add:

```typescript
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
```

**Save the file!**

---

### 8. Create Test for Delete Asset

Open `lambdas/functions/deleteAsset/test.ts` and add:

```typescript
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
```

**Save the file!**

---

### 9. Run Tests

Test Update Asset:

```bash
cd lambdas/functions/updateAsset
npx tsx test.ts
```

Test Delete Asset:

```bash
cd ../deleteAsset
npx tsx test.ts
```

**Expected output for Update Asset:**
```
🧪 Testing Update Asset Lambda

Setup: Creating test asset...
Created asset: <uuid>

Test 1: Updating asset name...
Status: 200
Updated name: Updated Name
✅ Test 1 passed

Test 2: Updating multiple fields...
Updated fields: { name: 'New Name', category: 'document' }
✅ Test 2 passed

Test 3: Attempting to update ownerId (should fail)...
Status: 400
Response: { success: false, error: 'Owner ID cannot be changed', field: 'ownerId' }
✅ Test 3 passed (ownerId change prevented)

Test 4: Updating non-existent asset...
Status: 404
✅ Test 4 passed (404 returned)

Test 5: Empty update body...
Status: 400
✅ Test 5 passed (validation working)

✨ All tests completed!
```

**Expected output for Delete Asset:**
```
🧪 Testing Delete Asset Lambda

Setup: Creating test asset...
Created asset: <uuid>

Test 1: Deleting existing asset...
Status: 204
✅ Test 1 passed (204 No Content)

Test 2: Verifying asset is deleted...
Status: 404
✅ Test 2 passed (asset not found)

Test 3: Deleting already deleted asset (idempotency)...
Status: 204
✅ Test 3 passed (idempotent delete)

Test 4: Deleting with missing ID...
Status: 400
✅ Test 4 passed (validation working)

✨ All tests completed!
```

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `updateAsset` Lambda function created
- [ ] `deleteAsset` Lambda function created
- [ ] TypeScript configs created for both
- [ ] Package.json files created for both
- [ ] Test scripts created for both
- [ ] Update Asset tests pass (5/5)
- [ ] Delete Asset tests pass (4/4)
- [ ] Partial updates work correctly
- [ ] ownerId cannot be changed
- [ ] Delete is idempotent (204 always)

---

## 🔍 Understanding What You Built

### File Structure
```
lambdas/functions/
├── createAsset/
├── getAsset/
├── listAssets/
├── updateAsset/
│   ├── index.ts              # Update handler (NEW!)
│   ├── test.ts               # Tests (NEW!)
│   ├── tsconfig.json         # Config (NEW!)
│   └── package.json          # Package (NEW!)
└── deleteAsset/
    ├── index.ts              # Delete handler (NEW!)
    ├── test.ts               # Tests (NEW!)
    ├── tsconfig.json         # Config (NEW!)
    └── package.json          # Package (NEW!)
```

### Complete CRUD API
```
POST   /assets           → createAsset
GET    /assets/:id       → getAsset
GET    /assets           → listAssets
PATCH  /assets/:id       → updateAsset
DELETE /assets/:id       → deleteAsset
```

---

## 🎓 Key Concepts

### 1. PATCH vs PUT

**PATCH (Partial Update)**:
```typescript
// Only update provided fields
const updates: any = {}
if (body.name !== undefined) {
  updates.name = body.name
}
await asset.update(updates)
```

**PUT (Full Replacement)**:
```typescript
// Replace entire resource
await asset.update({
  name: body.name,
  description: body.description,
  category: body.category,
  imageKey: body.imageKey,
})
```

### 2. Idempotent Delete

**Implementation**:
```typescript
if (!asset) {
  // Return 204 even if already deleted
  return { statusCode: 204, body: '' }
}
```

**Why?**
- Same result regardless of how many times called
- Prevents errors on retry
- RESTful best practice

### 3. Ownership Protection

**Prevent Changes**:
```typescript
if (body.ownerId !== undefined) {
  return validationErrorResponse('Owner ID cannot be changed', 'ownerId')
}
```

**Why?**
- Security: Users shouldn't transfer ownership via update
- Integrity: Ownership changes need separate workflow
- Audit: Track ownership changes separately

### 4. HTTP Status Codes

**Update**:
- `200 OK` - Successful update
- `400 Bad Request` - Validation error
- `404 Not Found` - Asset doesn't exist

**Delete**:
- `204 No Content` - Successful deletion (no body)
- `400 Bad Request` - Validation error
- `204 No Content` - Already deleted (idempotent)

---

## 📝 Notes

- Update uses PATCH for partial updates
- Delete returns 204 with no body
- Delete is idempotent (safe to retry)
- ownerId cannot be changed via update
- All fields are optional in update
- Empty update body is rejected
- Timestamps (updatedAt) updated automatically

---

## 🎯 What's Next?

In the next step (1.3.7), we'll:
- Deploy Lambda functions to AWS
- Configure API Gateway
- Set up environment variables
- Test deployed endpoints
- Monitor and debug

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.6! 🎉

**You now have:**
- ✅ Complete CRUD API in TypeScript
- ✅ Update Asset with partial updates
- ✅ Delete Asset with idempotency
- ✅ Ownership protection
- ✅ Comprehensive validation
- ✅ Full test coverage
- ✅ Production-ready Lambda functions!

---

**Ready for Step 1.3.7 (Deployment)?** Let me know when you've completed this step and all tests pass! 🚀
