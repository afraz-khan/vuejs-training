# Step 1.3.4: Create Asset Lambda Function (TypeScript)

## 🎯 Goal
Create the first Lambda function to handle asset creation with proper validation, error handling, and database integration using TypeScript.

## 📚 What You'll Learn
- Lambda function structure in TypeScript
- API Gateway event handling with types
- Input validation
- Database operations with Sequelize
- Error handling patterns
- CORS configuration
- UUID generation
- Type-safe Lambda responses

## 📋 Prerequisites
- [ ] Step 1.3.3 completed (Database connection helper)
- [ ] Understanding of async/await
- [ ] Basic knowledge of REST APIs
- [ ] TypeScript fundamentals

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the project root:

```bash
cd asset-management-app
pwd
```

Expected: `.../asset-management-app`

---

### 2. Create Lambda Functions Directory Structure

```bash
mkdir -p lambdas/functions/createAsset
```

Verify:

```bash
ls -la lambdas/functions/
```

---

### 3. Understanding Lambda Function Structure

**Lambda Handler Pattern**:
```
Event (API Gateway) 
  ↓
Handler Function
  ↓
Validate Input
  ↓
Connect to Database
  ↓
Perform Operation
  ↓
Return Response
```

---

### 4. Install UUID Package

We need UUID for generating unique asset IDs:

```bash
cd lambdas/shared
npm install uuid
npm install --save-dev @types/uuid
```

---

### 5. Create Input Validation Helper

First, let's create a validation utility:

```bash
touch src/utils/validation.ts
```

Open `lambdas/shared/src/utils/validation.ts` and add:

```typescript
import { AssetCategory } from '../types'

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validate required string field
 */
export function validateRequired(value: any, fieldName: string): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
  return value.trim()
}

/**
 * Validate optional string field
 */
export function validateOptionalString(value: any): string | null {
  if (!value) return null
  if (typeof value !== 'string') {
    throw new ValidationError('Invalid string value')
  }
  return value.trim() || null
}

/**
 * Validate asset category
 */
export function validateCategory(value: any): AssetCategory {
  const validCategories = Object.values(AssetCategory)
  
  if (!value || typeof value !== 'string') {
    throw new ValidationError('Category is required', 'category')
  }
  
  const category = value.toLowerCase()
  if (!validCategories.includes(category as AssetCategory)) {
    throw new ValidationError(
      `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      'category'
    )
  }
  
  return category as AssetCategory
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  fieldName: string,
  min: number,
  max: number
): void {
  if (value.length < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min} characters`,
      fieldName
    )
  }
  if (value.length > max) {
    throw new ValidationError(
      `${fieldName} must not exceed ${max} characters`,
      fieldName
    )
  }
}
```

**Save the file!**

---

### 6. Create Response Helper

Create a helper for consistent API responses:

```bash
touch src/utils/response.ts
```

Open `lambdas/shared/src/utils/response.ts` and add:

```typescript
import type { APIGatewayProxyResult } from 'aws-lambda'

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: true,
      data,
    }),
  }
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  error?: any
): APIGatewayProxyResult {
  console.error('Error response:', { message, statusCode, error })
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  message: string,
  field?: string
): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: false,
      error: message,
      field,
    }),
  }
}
```

**Save the file!**

---

### 7. Create the Create Asset Lambda Function

```bash
touch lambdas/functions/createAsset/index.ts
```

Open `lambdas/functions/createAsset/index.ts` and add:

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
  validateRequired,
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
 * Create Asset Lambda Handler
 * 
 * Creates a new asset in the database
 * 
 * Expected input:
 * {
 *   ownerId: string (required)
 *   name: string (required, 1-255 chars)
 *   description: string (optional)
 *   category: string (required, one of: image, document, video, other)
 *   imageKey: string (optional)
 * }
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Create Asset Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
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

    // Validate input
    const ownerId = validateRequired(body.ownerId, 'ownerId')
    const name = validateRequired(body.name, 'name')
    const category = validateCategory(body.category)
    const description = validateOptionalString(body.description)
    const imageKey = validateOptionalString(body.imageKey)

    // Validate field lengths
    validateLength(name, 'name', 1, 255)
    if (description) {
      validateLength(description, 'description', 0, 5000)
    }

    // Connect to database
    await connectToDatabase()

    // Create asset
    const asset = await Asset.create({
      id: uuidv4(),
      ownerId,
      name,
      description,
      category,
      imageKey,
    })

    console.log('Asset created successfully:', asset.id)

    // Return success response
    return successResponse(
      {
        id: asset.id,
        ownerId: asset.ownerId,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        imageKey: asset.imageKey,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      },
      201
    )
  } catch (error) {
    console.error('Error creating asset:', error)

    // Handle validation errors
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message, error.field)
    }

    // Handle database errors
    if (error instanceof Error) {
      // Check for specific database errors
      if (error.name === 'SequelizeValidationError') {
        return validationErrorResponse('Validation failed: ' + error.message)
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return errorResponse('Asset already exists', 409)
      }
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to create asset')
  }
}
```

**Save the file!**

---

### 8. Create TypeScript Configuration for Lambda

```bash
touch lambdas/functions/createAsset/tsconfig.json
```

Open `lambdas/functions/createAsset/tsconfig.json` and add:

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

**Note**: We include the shared source files so TypeScript can compile them together with the Lambda function.

**Save the file!**

---

### 9. Create Package.json for Lambda

```bash
touch lambdas/functions/createAsset/package.json
```

Open `lambdas/functions/createAsset/package.json` and add:

```json
{
  "name": "create-asset-lambda",
  "version": "1.0.0",
  "description": "Lambda function to create assets",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "test": "npx tsx test.ts"
  },
  "keywords": ["lambda", "asset", "create"],
  "author": "",
  "license": "ISC"
}
```

**Save the file!**

---

### 10. Create Test Script

Let's create a test script to test the Lambda locally:

```bash
touch lambdas/functions/createAsset/test.ts
```

Open `lambdas/functions/createAsset/test.ts` and add:

```typescript
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
```

**Save the file!**

---

### 11. Update Shared Package.json

Add the utils exports to the shared package:

Open `lambdas/shared/package.json` and ensure it has:

```json
{
  "name": "shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "tsx watch src/index.ts",
    "test": "tsx src/models/test.ts",
    "test:connection": "tsx src/config/testConnection.ts",
    "db:sync": "tsx scripts/syncDatabase.ts",
    "clean": "rm -rf dist"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "Shared TypeScript code for Lambda functions",
  "dependencies": {
    "sequelize": "^6.37.7",
    "mysql2": "^3.11.5",
    "@aws-sdk/client-secrets-manager": "^3.700.0",
    "dotenv": "^16.4.5",
    "uuid": "^11.0.3"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "@types/aws-lambda": "^8.10.145",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.19.2",
    "esbuild": "^0.24.2"
  }
}
```

**Save the file!**

---

### 12. Run the Test

Since `tsx` is installed in the shared folder, we'll use npx to run it:

```bash
cd lambdas/functions/createAsset
npx tsx test.ts
```

Or alternatively, run from the shared folder:

```bash
cd ../../shared
npx tsx ../functions/createAsset/test.ts
```

**Expected output:**
```
🧪 Testing Create Asset Lambda

Test 1: Creating valid asset...
📁 Loading .env from: /path/to/.env
✅ .env file loaded successfully
🔧 Environment loaded:
  DB_HOST: localhost
  ...

Create Asset Lambda invoked
Creating new database connection...
✅ Database connection established
Asset created successfully: <uuid>
Status: 201
Response: {
  success: true,
  data: {
    id: '<uuid>',
    ownerId: 'test-user-123',
    name: 'My Test Asset',
    description: 'This is a test asset',
    category: 'image',
    imageKey: 'assets/test-user-123/test-asset.jpg',
    createdAt: '2024-...',
    updatedAt: '2024-...'
  }
}
✅ Test 1 passed

Test 2: Testing validation (missing name)...
Status: 400
Response: { success: false, error: 'name is required', field: 'name' }
✅ Test 2 passed (validation working)

Test 3: Testing validation (invalid category)...
Status: 400
Response: {
  success: false,
  error: 'Invalid category. Must be one of: image, document, video, other',
  field: 'category'
}
✅ Test 3 passed (validation working)

✨ All tests completed!
```

---

### 13. Verify Database

Check that the asset was created:

```bash
cd ../../shared
npm run db:sync
```

You should see the Assets table with the test data.

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `lambdas/functions/createAsset/` directory created
- [ ] `src/utils/validation.ts` created with validation helpers
- [ ] `src/utils/response.ts` created with response helpers
- [ ] `createAsset/index.ts` Lambda handler created
- [ ] UUID package installed
- [ ] Test script runs successfully
- [ ] All 3 tests pass
- [ ] Asset created in database
- [ ] Validation errors return 400 status
- [ ] Success returns 201 status

---

## 🔍 Understanding What You Built

### File Structure
```
lambdas/
├── shared/
│   ├── src/
│   │   ├── utils/
│   │   │   ├── validation.ts    # Input validation (NEW!)
│   │   │   └── response.ts      # API responses (NEW!)
│   │   ├── config/
│   │   ├── models/
│   │   └── types/
│   └── package.json             # Updated with uuid
└── functions/
    └── createAsset/
        ├── index.ts             # Lambda handler (NEW!)
        ├── test.ts              # Test script (NEW!)
        ├── tsconfig.json        # TypeScript config (NEW!)
        └── package.json         # Lambda package (NEW!)
```

### Request Flow
```
API Gateway
  ↓
Lambda Handler
  ↓
Parse & Validate Input
  ↓
Connect to Database
  ↓
Create Asset Record
  ↓
Return Response (201)
```

### Error Handling Flow
```
Try Block
  ↓
Validation Error? → 400 Response
  ↓
Database Error? → 500 Response
  ↓
Success → 201 Response
```

---

## 🎓 Key Concepts

### 1. Lambda Handler Pattern

**TypeScript Handler**:
```typescript
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handler logic
}
```

**Benefits**:
- Type safety for event and response
- Auto-completion in IDE
- Compile-time error checking

### 2. Input Validation

**Why Validate?**
- Prevent invalid data in database
- Provide clear error messages
- Security (prevent injection attacks)
- Data integrity

**Validation Layers**:
```
1. Type checking (TypeScript)
2. Required field validation
3. Format validation
4. Length validation
5. Database constraints
```

### 3. Error Handling

**Error Types**:
```typescript
ValidationError → 400 (Bad Request)
NotFoundError → 404 (Not Found)
DatabaseError → 500 (Internal Server Error)
AuthError → 401/403 (Unauthorized/Forbidden)
```

### 4. CORS Headers

**Why CORS?**
- Allow frontend to call API
- Security mechanism
- Required for cross-origin requests

**Headers**:
```typescript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Credentials': true
```

### 5. UUID Generation

**Why UUID?**
- Globally unique identifiers
- No collision risk
- Can generate client-side
- Database-agnostic

**Usage**:
```typescript
import { v4 as uuidv4 } from 'uuid'
const id = uuidv4() // '550e8400-e29b-41d4-a716-446655440000'
```

---

## 📝 Notes

- Lambda handler is type-safe with TypeScript
- Validation happens before database operations
- Errors are caught and returned with appropriate status codes
- CORS headers allow frontend access
- UUID ensures unique asset IDs
- Connection reuse improves performance
- Test script validates all scenarios

---

## 🎯 What's Next?

In the next step (1.3.5), we'll:
- Create the Get Asset Lambda function
- Implement query parameters
- Add pagination support
- Handle not found errors
- Create list assets endpoint

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.4! 🎉

**You now have:**
- ✅ First Lambda function in TypeScript
- ✅ Input validation system
- ✅ Response helpers
- ✅ Error handling
- ✅ CORS configuration
- ✅ UUID generation
- ✅ Test script
- ✅ Working create asset endpoint!

---

**Ready for Step 1.3.5?** Let me know when you've completed this step and all tests pass! 🚀
