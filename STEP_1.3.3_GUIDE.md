# Step 1.3.3: Create Database Connection Helper (TypeScript)

## 🎯 Goal
Create a robust database connection helper that manages connections to RDS MySQL, handles connection pooling, and integrates with AWS Secrets Manager for credentials.

## 📚 What You'll Learn
- Database connection management in TypeScript
- Connection pooling best practices
- AWS Secrets Manager integration
- Error handling for database connections
- Environment-based configuration
- Lambda execution context reuse

## 📋 Prerequisites
- [ ] Step 1.3.2 completed (Sequelize model created in TypeScript)
- [ ] Understanding of Sequelize connection
- [ ] Basic knowledge of async/await
- [ ] Understanding of Lambda execution context

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the shared Lambda directory:

```bash
cd lambdas/shared
pwd
```

Expected: `.../asset-management-app/lambdas/shared`

---

### 2. Understanding Lambda Execution Context

**Key Concept**: Lambda containers are reused between invocations!

```
First Invocation:
  ↓
Initialize connection (slow)
  ↓
Execute handler
  ↓
Container stays warm

Second Invocation (same container):
  ↓
Reuse existing connection (fast!)
  ↓
Execute handler
```

**Best Practice**: Initialize connections outside the handler function to reuse them.

---

### 3. Create Database Helper File

```bash
touch src/config/dbHelper.ts
```

Open `lambdas/shared/src/config/dbHelper.ts` and add:

```typescript
import { sequelize } from '../models'
import type { Sequelize } from 'sequelize'

/**
 * Database Connection Helper
 * Manages Sequelize connection lifecycle for Lambda functions
 */

let isConnected = false

/**
 * Connect to database
 * Reuses existing connection if available (Lambda container reuse)
 */
export async function connectToDatabase(): Promise<Sequelize> {
  if (isConnected) {
    console.log('Using existing database connection')
    return sequelize
  }

  try {
    console.log('Creating new database connection...')
    await sequelize.authenticate()
    isConnected = true
    console.log('✅ Database connection established')
    return sequelize
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Database connection failed: ${errorMessage}`)
  }
}

/**
 * Close database connection
 * Call this when Lambda is shutting down (rare)
 */
export async function closeDatabase(): Promise<void> {
  if (!isConnected) {
    return
  }

  try {
    await sequelize.close()
    isConnected = false
    console.log('Database connection closed')
  } catch (error) {
    console.error('Error closing database:', error)
    throw error
  }
}

/**
 * Test database connection
 * Useful for health checks
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await sequelize.authenticate()
    return { success: true, message: 'Connection successful' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get connection status
 */
export function isConnectionActive(): boolean {
  return isConnected
}
```

**Save the file!**

---

### 4. Understanding the Connection Helper

#### **Connection Reuse Pattern**:
```typescript
let isConnected = false  // Module-level variable

// First call: Creates connection
await connectToDatabase()  // isConnected = true

// Second call (same container): Reuses connection
await connectToDatabase()  // Returns immediately
```

#### **Why This Matters**:
- **Performance**: Avoid connection overhead on every invocation
- **Cost**: Faster execution = lower Lambda costs
- **Reliability**: Fewer connection attempts = fewer failures

---

### 5. Create AWS Secrets Manager Helper

For production, we'll store database credentials in AWS Secrets Manager.

```bash
touch src/config/secretsManager.ts
```

Open `lambdas/shared/src/config/secretsManager.ts` and add:

```typescript
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'
import type { DatabaseSecret } from '../types'

// Cache secrets to avoid repeated API calls
const secretCache: Record<string, any> = {}

/**
 * Get secret from AWS Secrets Manager
 * Caches the result for Lambda container reuse
 */
export async function getSecret(secretName: string): Promise<any> {
  // Return cached secret if available
  if (secretCache[secretName]) {
    console.log(`Using cached secret: ${secretName}`)
    return secretCache[secretName]
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
  })

  try {
    console.log(`Fetching secret: ${secretName}`)
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    )

    let secret: any
    if (response.SecretString) {
      secret = JSON.parse(response.SecretString)
    } else if (response.SecretBinary) {
      // Binary secret (rare for DB credentials)
      const buff = Buffer.from(response.SecretBinary)
      secret = JSON.parse(buff.toString('ascii'))
    } else {
      throw new Error('Secret has no string or binary value')
    }

    // Cache the secret
    secretCache[secretName] = secret
    console.log(`✅ Secret fetched and cached: ${secretName}`)
    return secret
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error fetching secret ${secretName}:`, error)
    throw new Error(`Failed to fetch secret: ${errorMessage}`)
  }
}

/**
 * Get database credentials from Secrets Manager
 */
export async function getDatabaseCredentials(): Promise<DatabaseSecret> {
  const secretName = process.env.DB_SECRET_NAME

  if (!secretName) {
    throw new Error('DB_SECRET_NAME environment variable not set')
  }

  const secret = await getSecret(secretName)

  return {
    host: secret.host,
    port: secret.port || 3306,
    database: secret.dbname || secret.database,
    username: secret.username,
    password: secret.password,
  }
}

/**
 * Clear secret cache (useful for testing)
 */
export function clearSecretCache(): void {
  Object.keys(secretCache).forEach((key) => delete secretCache[key])
  console.log('Secret cache cleared')
}
```

**Save the file!**

---

### 6. Create Test Script for Connection Helper

```bash
touch src/config/testConnection.ts
```

Open `lambdas/shared/src/config/testConnection.ts` and add:

```typescript
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
```

**Save the file!**

---

### 7. Update package.json Scripts

Add the test:connection script to package.json.

Open `lambdas/shared/package.json` and update the scripts section:

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "tsx watch src/index.ts",
    "test": "tsx src/models/test.ts",
    "test:connection": "tsx src/config/testConnection.ts",
    "db:sync": "tsx scripts/syncDatabase.ts",
    "clean": "rm -rf dist"
  }
}
```

**Save the file!**

---

### 8. Run Connection Tests

Run the test to verify everything works:

```bash
npm run test:connection
```

**Expected output:**
```
🧪 Testing Database Connection Helper

Test 1: Connecting to database...
📁 Loading .env from: /path/to/.env
✅ .env file loaded successfully
🔧 Environment loaded:
  DB_HOST: localhost
  DB_PORT: 3306
  DB_NAME: HeraTraining
  DB_USER: root
  DB_PASSWORD: ***

Creating new database connection...
✅ Database connection established
✅ Test 1 passed

Test 2: Checking connection status...
Connection active: true
✅ Test 2 passed

Test 3: Testing connection...
Result: { success: true, message: 'Connection successful' }
✅ Test 3 passed

Test 4: Querying database...
Found 0 assets in database
✅ Test 4 passed

Test 5: Testing connection reuse...
Using existing database connection
✅ Test 5 passed

✨ All tests passed!

👋 Connection closed
```

---

### 9. Create Lambda Handler Example

Let's create an example Lambda handler to show how to use the connection helper.

```bash
mkdir -p ../examples
touch ../examples/exampleHandler.ts
```

Open `lambdas/examples/exampleHandler.ts` and add:

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { connectToDatabase } from '../shared/src/config/dbHelper'
import { Asset } from '../shared/src/models'

/**
 * Example Lambda handler showing proper database connection usage
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Connect to database (reuses connection if available)
    await connectToDatabase()

    // Your business logic here
    const assets = await Asset.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: assets,
      }),
    }
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    }
  }
  // Note: We don't close the connection here
  // Lambda will reuse it for the next invocation
}
```

**Save the file!**

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `src/config/dbHelper.ts` created with connection management
- [ ] `src/config/secretsManager.ts` created for AWS Secrets
- [ ] `src/config/testConnection.ts` created
- [ ] `package.json` updated with test:connection script
- [ ] Connection tests pass successfully (`npm run test:connection`)
- [ ] Example handler created in TypeScript
- [ ] Understand connection reuse pattern
- [ ] Understand Lambda execution context

---

## 🔍 Understanding What You Built

### File Structure
```
lambdas/
├── shared/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts               # Environment config
│   │   │   ├── database.ts          # Database configuration
│   │   │   ├── dbHelper.ts          # Connection helper (NEW!)
│   │   │   ├── secretsManager.ts    # AWS Secrets helper (NEW!)
│   │   │   └── testConnection.ts    # Connection tests (NEW!)
│   │   ├── models/
│   │   │   ├── index.ts
│   │   │   ├── Asset.ts
│   │   │   └── test.ts
│   │   └── types/
│   │       └── index.ts
│   ├── scripts/
│   │   └── syncDatabase.ts
│   └── package.json
└── examples/
    └── exampleHandler.ts            # Example Lambda (NEW!)
```

### Connection Flow
```
Lambda Invocation
  ↓
connectToDatabase()
  ↓
Check isConnected?
  ├─ Yes → Return existing connection (fast)
  └─ No  → Create new connection (slow)
       ↓
       sequelize.authenticate()
       ↓
       isConnected = true
       ↓
       Return connection
```

---

## 🎓 Key Concepts

### 1. Lambda Container Reuse

**Cold Start** (first invocation):
```typescript
// Global scope - runs once per container
import { sequelize } from './models'
let isConnected = false

// Handler - runs on every invocation
export const handler = async (event: APIGatewayProxyEvent) => {
  await connectToDatabase()  // Creates connection
  // ... business logic
}
```

**Warm Start** (subsequent invocations):
```typescript
// Global scope - already initialized
// isConnected = true from previous invocation

export const handler = async (event: APIGatewayProxyEvent) => {
  await connectToDatabase()  // Reuses connection
  // ... business logic
}
```

### 2. Connection Pooling

**Pool Configuration**:
```typescript
pool: {
  max: 5,      // Maximum 5 connections
  min: 0,      // Minimum 0 connections
  acquire: 30000,  // Max time to get connection (30s)
  idle: 10000,     // Max idle time (10s)
}
```

**Why Pool?**
- Handle concurrent queries
- Reuse connections efficiently
- Prevent connection exhaustion

### 3. Secrets Manager Caching

**Without Caching**:
```
Every Lambda invocation → API call to Secrets Manager
Cost: $0.05 per 10,000 API calls
Latency: ~100ms per call
```

**With Caching**:
```
First invocation → API call (cache miss)
Subsequent invocations → Use cached value
Cost: Minimal
Latency: ~0ms
```

### 4. TypeScript Benefits

**Type Safety**:
```typescript
// Compile-time error if wrong return type
const result: { success: boolean; message: string } = await testConnection()
```

**Better Error Handling**:
```typescript
try {
  await sequelize.authenticate()
} catch (error) {
  // TypeScript knows error might not be Error type
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  throw new Error(`Database connection failed: ${errorMessage}`)
}
```

---

## 📝 Notes

- Connection helper is ready for Lambda use
- Secrets Manager integration prepared for AWS deployment
- Connection reuse improves performance significantly
- Don't close connections in Lambda handlers
- Test locally before deploying to AWS
- Monitor connection pool usage in production
- TypeScript provides type safety for all database operations

---

## ⚠️ Important Note

**The code in this guide will be updated in Step 1.3.8** to add full AWS Secrets Manager integration for production deployments. The current code works for local development and testing. When you reach Step 1.3.8, you'll update:

- `env.ts` - Add `getDbCredentials()` function
- `database.ts` - Make it async to support Secrets Manager
- `models/index.ts` - Adjust for synchronous initialization
- `dbHelper.ts` - Fetch credentials from Secrets Manager before connecting

For now, continue with the current implementation which uses environment variables from `.env` files.

---

## 🎯 What's Next?

In the next step (1.3.4), we'll:
- Create the first Lambda function (createAsset) in TypeScript
- Use the connection helper
- Implement input validation
- Handle errors properly
- Return proper API responses

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.3! 🎉

**You now have:**
- ✅ Robust database connection helper in TypeScript
- ✅ AWS Secrets Manager integration (basic)
- ✅ Connection reuse for performance
- ✅ Type-safe database operations
- ✅ Comprehensive error handling
- ✅ Test scripts for verification
- ✅ Example Lambda handler in TypeScript
- ✅ Ready for Lambda function development!

---

**Ready for Step 1.3.4?** Let me know when you've completed this step and all tests pass! 🚀
