# Step 1.3.8: Deploy Lambda Functions and API Gateway

## 🎯 Goal
Deploy Lambda functions to AWS with VPC access to RDS MySQL, set up API Gateway REST API, sync database schema, and test all endpoints in production.

## 📚 What You'll Learn
- Deploying Lambda functions with AWS CDK
- Configuring Lambda VPC access to RDS
- Setting up API Gateway REST API
- Lambda environment variables and secrets
- Database schema synchronization
- Testing deployed endpoints
- CloudWatch monitoring

## 📋 Prerequisites
- [ ] Step 1.3.7 completed (RDS MySQL deployed)
- [ ] RDS endpoint and credentials in Secrets Manager
- [ ] All Lambda functions tested locally

## 🚀 Step-by-Step Instructions

### 1. Add Lambda Functions to Backend with CDK

We'll add Lambda functions to the Amplify backend using AWS CDK. Open `amplify/backend.ts` and add Lambda function definitions.
First, let's add the necessary imports at the top of the file:

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
```

Then, after the RDS instance creation and before `backend.addOutput`, add the Lambda functions:

```typescript
// Allow Lambda to access RDS
dbSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(3306),
  'Allow Lambda to access RDS'
)

// Create Lambda execution role with necessary permissions
const lambdaRole = new iam.Role(stack, 'LambdaExecutionRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
})

// Grant Lambda access to Secrets Manager
dbSecret.grantRead(lambdaRole)

// Common Lambda environment variables
const lambdaEnvironment = {
  DB_HOST: dbInstance.dbInstanceEndpointAddress,
  DB_PORT: '3306',
  DB_NAME: 'HeraTraining',
  DB_USER: 'admin',
  DB_SECRET_NAME: dbSecret.secretName,
  NODE_ENV: 'production',
}

// Common Lambda configuration
const lambdaConfig = {
  runtime: lambda.Runtime.NODEJS_20_X,
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  securityGroups: [dbSecurityGroup],
  environment: lambdaEnvironment,
  role: lambdaRole,
  timeout: Duration.seconds(30),
  memorySize: 256,
}

// Create Lambda functions
const createAssetFn = new lambda.Function(stack, 'CreateAssetFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-createAsset',
  code: lambda.Code.fromAsset('lambdas/functions/createAsset'),
  handler: 'index.handler',
})

const getAssetFn = new lambda.Function(stack, 'GetAssetFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-getAsset',
  code: lambda.Code.fromAsset('lambdas/functions/getAsset'),
  handler: 'index.handler',
})

const listAssetsFn = new lambda.Function(stack, 'ListAssetsFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-listAssets',
  code: lambda.Code.fromAsset('lambdas/functions/listAssets'),
  handler: 'index.handler',
})

const updateAssetFn = new lambda.Function(stack, 'UpdateAssetFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-updateAsset',
  code: lambda.Code.fromAsset('lambdas/functions/updateAsset'),
  handler: 'index.handler',
})

const deleteAssetFn = new lambda.Function(stack, 'DeleteAssetFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-deleteAsset',
  code: lambda.Code.fromAsset('lambdas/functions/deleteAsset'),
  handler: 'index.handler',
})

const syncSchemaFn = new lambda.Function(stack, 'SyncSchemaFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-syncSchema',
  code: lambda.Code.fromAsset('lambdas/functions/syncSchema'),
  handler: 'index.handler',
  timeout: Duration.seconds(60), // Longer timeout for schema sync
})

// Create API Gateway
const api = new apigateway.RestApi(stack, 'AssetManagementApi', {
  restApiName: 'Asset Management API',
  description: 'API for managing assets',
  deployOptions: {
    stageName: 'prod',
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
    dataTraceEnabled: true,
  },
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'Authorization'],
  },
})

// Create API resources and methods
const assets = api.root.addResource('assets')

// POST /assets - Create asset
assets.addMethod('POST', new apigateway.LambdaIntegration(createAssetFn))

// GET /assets - List assets
assets.addMethod('GET', new apigateway.LambdaIntegration(listAssetsFn))

// GET /assets/{id} - Get asset by ID
const asset = assets.addResource('{id}')
asset.addMethod('GET', new apigateway.LambdaIntegration(getAssetFn))

// PATCH /assets/{id} - Update asset
asset.addMethod('PATCH', new apigateway.LambdaIntegration(updateAssetFn))

// DELETE /assets/{id} - Delete asset
asset.addMethod('DELETE', new apigateway.LambdaIntegration(deleteAssetFn))

// Add sync-schema endpoint (for one-time use)
const admin = api.root.addResource('admin')
const syncSchema = admin.addResource('sync-schema')
syncSchema.addMethod('POST', new apigateway.LambdaIntegration(syncSchemaFn))
```

**Save the file!**

---

### 2. Update Shared Code for Secrets Manager Integration

Before deploying, we need to update the shared Lambda code to fetch database credentials from AWS Secrets Manager in production.

**Step 2.1: Update env.ts to add getDbCredentials function**

Open `lambdas/shared/src/config/env.ts` and replace the entire file with:

```typescript
import dotenv from 'dotenv'
import path from 'path'
import { getDatabaseCredentials } from './secretsManager'

// Load environment variables from .env file
// Try multiple locations to find .env
const possiblePaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '../../.env'),
  path.join(__dirname, '../../../.env'),
]

let loaded = false
for (const envPath of possiblePaths) {
  const result = dotenv.config({ path: envPath })
  if (!result.error) {
    console.log('📄 Loading .env from:', envPath)
    console.log('✅ .env file loaded successfully')
    loaded = true
    break
  }
}

if (!loaded) {
  console.warn('⚠️  Warning: Could not load .env file from any location')
  console.log('💡 Trying default .env location...')
  dotenv.config() // Fallback to default behavior
}

/**
 * Type-safe environment variables
 */
export const env = {
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306'),
  DB_NAME: process.env.DB_NAME || '',
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  
  // AWS
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  DB_SECRET_NAME: process.env.DB_SECRET_NAME || '',
  
  // Environment
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  
  // Database Pool
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '5'),
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN || '0'),
} as const

// Debug: Log loaded environment variables (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment loaded:')
  console.log('  DB_HOST:', env.DB_HOST)
  console.log('  DB_PORT:', env.DB_PORT)
  console.log('  DB_NAME:', env.DB_NAME)
  console.log('  DB_USER:', env.DB_USER)
  console.log('  DB_PASSWORD:', env.DB_PASSWORD ? '***' : '(empty)')
  console.log()
}

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER']
  const missing = required.filter((key) => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

/**
 * Get database credentials with Secrets Manager support
 * In production, fetches password from AWS Secrets Manager
 * In development, uses environment variables
 */
export async function getDbCredentials() {
  // In production with Secrets Manager configured
  if (env.NODE_ENV === 'production' && env.DB_SECRET_NAME) {
    console.log('🔐 Fetching database credentials from AWS Secrets Manager...')
    try {
      const credentials = await getDatabaseCredentials()
      return {
        host: credentials.host || env.DB_HOST,
        port: credentials.port || env.DB_PORT,
        database: credentials.database || env.DB_NAME,
        username: credentials.username || env.DB_USER,
        password: credentials.password,
      }
    } catch (error) {
      console.error('❌ Failed to fetch from Secrets Manager:', error)
      console.log('⚠️  Falling back to environment variables')
      // Fallback to environment variables
      return {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        username: env.DB_USER,
        password: env.DB_PASSWORD,
      }
    }
  }
  
  // Development: use environment variables
  console.log('🔧 Using environment variables for database credentials')
  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
  }
}
```

**What changed:**
- Added `getDbCredentials()` function that fetches from Secrets Manager in production
- Imports `getDatabaseCredentials` from `secretsManager.ts`
- Handles fallback to environment variables if Secrets Manager fails

**Step 2.2: Update database.ts to use async credentials**

Open `lambdas/shared/src/config/database.ts` and replace the entire file with:

```typescript
import { Options } from 'sequelize'
import { env, getDbCredentials } from './env'

/**
 * Get Sequelize configuration based on environment
 * Async to support Secrets Manager in production
 */
export async function getDatabaseConfig(): Promise<Options> {
  // Get credentials (from Secrets Manager in production, or env vars in development)
  const credentials = await getDbCredentials()
  
  const baseConfig: Options = {
    dialect: 'mysql',
    host: credentials.host,
    port: credentials.port,
    database: credentials.database,
    username: credentials.username,
    password: credentials.password,
    logging: env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: env.DB_POOL_MAX,
      min: env.DB_POOL_MIN,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    },
  }

  return baseConfig
}
```

**What changed:**
- Function is now `async` and returns `Promise<Options>`
- Calls `getDbCredentials()` to fetch credentials
- Uses fetched credentials for Sequelize config

**Step 2.3: Update models/index.ts for synchronous initialization**

Open `lambdas/shared/src/models/index.ts` and replace the entire file with:

```typescript
import { Sequelize } from 'sequelize'
import { env } from '../config/env'
import { defineAssetModel, AssetModel } from './Asset'

// Create Sequelize instance with placeholder config
// Actual connection happens in dbHelper.connectToDatabase()
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  logging: env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: env.DB_POOL_MAX,
    min: env.DB_POOL_MIN,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    connectTimeout: 60000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
})

// Initialize models
const Asset: AssetModel = defineAssetModel(sequelize)

// Export sequelize instance and models
export { sequelize, Sequelize, Asset }

// Export types
export type { AssetModel }
```

**What changed:**
- Sequelize is initialized synchronously with env vars
- Actual credentials (including Secrets Manager password) are fetched in `dbHelper.connectToDatabase()`
- Removed auto-sync code (we'll use syncSchema Lambda instead)

**Step 2.4: Update dbHelper.ts to fetch credentials before connecting**

Open `lambdas/shared/src/config/dbHelper.ts` and replace the entire file with:

```typescript
import { sequelize } from '../models'
import { getDbCredentials, env } from './env'
import type { Sequelize } from 'sequelize'

/**
 * Database Connection Helper
 * Manages Sequelize connection lifecycle for Lambda functions
 */

let isConnected = false

/**
 * Initialize database credentials from Secrets Manager (production only)
 * Must be called before first connection
 */
async function initializeCredentials(): Promise<void> {
  if (env.NODE_ENV === 'production' && env.DB_SECRET_NAME && !process.env.DB_PASSWORD) {
    console.log('🔐 Fetching credentials from Secrets Manager...')
    const credentials = await getDbCredentials()
    
    // Update process.env so Sequelize uses the fetched password
    process.env.DB_PASSWORD = credentials.password
    console.log('✅ Credentials fetched and set')
  }
}

/**
 * Connect to database
 * Reuses existing connection if available (Lambda container reuse)
 * Fetches credentials from Secrets Manager in production on first call
 */
export async function connectToDatabase(): Promise<Sequelize> {
  // If already connected, return existing connection
  if (isConnected) {
    console.log('♻️  Using existing database connection')
    return sequelize
  }

  try {
    console.log('🔌 Creating new database connection...')
    
    // Fetch credentials from Secrets Manager if needed (production only, first time)
    await initializeCredentials()
    
    // Test the connection
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

**What changed:**
- Added `initializeCredentials()` helper function
- Fetches password from Secrets Manager and sets `process.env.DB_PASSWORD`
- Sequelize reads the updated environment variable
- Simpler approach - no need to modify read-only Sequelize config
- Credentials only fetched once (checked with `!process.env.DB_PASSWORD`)

**Step 2.5: Verify the changes**

```bash
# Check that env.ts has the new function
grep -c "getDbCredentials" lambdas/shared/src/config/env.ts

# Check that dbHelper.ts uses it
grep -c "getDbCredentials" lambdas/shared/src/config/dbHelper.ts
```

**Expected output:**
```
2  # env.ts has 2 occurrences (definition + export)
2  # dbHelper.ts has 2 occurrences (import + usage)
```

---

### 3. Prepare Lambda Functions for Deployment

Each Lambda function needs to be bundled with its dependencies. We'll copy the shared code to each function directory.

**Step 2.1: Navigate to lambdas directory**

```bash
cd lambdas
```

**Step 2.2: Create the deployment preparation script**

```bash
cat > deploy-prep.sh << 'EOF'
#!/bin/bash

# Deployment Preparation Script
# Copies shared code to each Lambda function for deployment

echo "🚀 Preparing Lambda functions for deployment..."

# Array of function names
FUNCTIONS=("createAsset" "getAsset" "listAssets" "updateAsset" "deleteAsset" "syncSchema")

# Copy shared code to each function
for func in "${FUNCTIONS[@]}"; do
  echo "📦 Preparing $func..."
  
  # Create shared directory in function
  mkdir -p "functions/$func/shared"
  
  # Copy shared source code
  cp -r shared/src "functions/$func/shared/"
  
  # Copy node_modules if they exist
  if [ -d "shared/node_modules" ]; then
    echo "  📚 Copying node_modules..."
    cp -r shared/node_modules "functions/$func/" 2>/dev/null || true
  fi
  
  # Copy package.json for dependencies
  if [ -f "shared/package.json" ]; then
    cp shared/package.json "functions/$func/shared/"
  fi
  
  echo "  ✅ $func prepared"
done

echo ""
echo "✨ All functions prepared for deployment!"
echo ""
echo "Next steps:"
echo "1. cd .. (back to asset-management-app root)"
echo "2. npx ampx sandbox"
EOF
```

**Step 2.3: Make the script executable**

```bash
chmod +x deploy-prep.sh
```

**Step 2.4: Run the deployment preparation script**

```bash
./deploy-prep.sh
```

**Expected output:**
```
🚀 Preparing Lambda functions for deployment...
📦 Preparing createAsset...
  📚 Copying node_modules...
  ✅ createAsset prepared
📦 Preparing getAsset...
  📚 Copying node_modules...
  ✅ getAsset prepared
... (continues for all functions)
✨ All functions prepared for deployment!
```

**Step 2.5: Navigate back to asset-management-app root**

```bash
cd ..
```

**What this does:**
- Creates a `shared/` directory in each Lambda function folder
- Copies all shared source code (`shared/src/`) to each function
- Copies `node_modules` so each function has all dependencies
- Each function becomes a self-contained deployment package

---

### 4. Verify Secrets Manager Integration

The Lambda functions now fetch database credentials from AWS Secrets Manager at runtime. Let's verify the integration is complete.

**Step 4.1: Check the Secrets Manager helper**

```bash
cat lambdas/shared/src/config/secretsManager.ts
```

**Expected content:**

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

**Key features:**
- ✅ Fetches secrets from AWS Secrets Manager
- ✅ Caches secrets for Lambda container reuse (performance optimization)
- ✅ Handles both string and binary secrets
- ✅ Proper error handling and logging

**Step 4.2: Verify Secrets Manager integration code**

The Lambda functions fetch database credentials from AWS Secrets Manager at runtime. Let's verify the code is in place.

**Check the env.ts file for the getDbCredentials function:**

```bash
grep -A 30 "getDbCredentials" lambdas/shared/src/config/env.ts
```

**Expected output - the actual runtime code:**

```typescript
/**
 * Get database credentials with Secrets Manager support
 * In production, fetches password from AWS Secrets Manager
 * In development, uses environment variables
 */
export async function getDbCredentials() {
  // In production with Secrets Manager configured
  if (env.NODE_ENV === 'production' && env.DB_SECRET_NAME) {
    console.log('🔐 Fetching database credentials from AWS Secrets Manager...')
    try {
      const credentials = await getDatabaseCredentials()
      return {
        host: credentials.host || env.DB_HOST,
        port: credentials.port || env.DB_PORT,
        database: credentials.database || env.DB_NAME,
        username: credentials.username || env.DB_USER,
        password: credentials.password,  // ← Password from Secrets Manager
      }
    } catch (error) {
      console.error('❌ Failed to fetch from Secrets Manager:', error)
      console.log('⚠️  Falling back to environment variables')
      // Fallback to environment variables
      return {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        username: env.DB_USER,
        password: env.DB_PASSWORD,
      }
    }
  }
  
  // Development: use environment variables
  console.log('🔧 Using environment variables for database credentials')
  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
  }
}
```

**Check the dbHelper.ts for how it's used:**

```bash
grep -A 10 "initializeCredentials" lambdas/shared/src/config/dbHelper.ts
```

**Expected output - where credentials are fetched:**

```typescript
async function initializeCredentials(): Promise<void> {
  if (env.NODE_ENV === 'production' && env.DB_SECRET_NAME && !process.env.DB_PASSWORD) {
    console.log('🔐 Fetching credentials from Secrets Manager...')
    const credentials = await getDbCredentials()  // ← Calls Secrets Manager here
    
    // Update process.env so Sequelize uses the fetched password
    process.env.DB_PASSWORD = credentials.password  // ← Password from Secrets Manager
    console.log('✅ Credentials fetched and set')
  }
}
```

**How it works at runtime:**

1. **Lambda starts** → `connectToDatabase()` is called
2. **Check if credentials needed** → If `NODE_ENV=production` and `DB_SECRET_NAME` is set and `DB_PASSWORD` not in env
3. **Fetch from Secrets Manager** → `getDbCredentials()` calls AWS Secrets Manager API
4. **Update environment** → Sets `process.env.DB_PASSWORD` with fetched password
5. **Connect to database** → `sequelize.authenticate()` uses the updated environment variable
6. **Cache for reuse** → Subsequent calls skip fetching (password already in `process.env`)

**Development vs Production:**
- **Development:** Uses `.env` file → `DB_PASSWORD` already set → No Secrets Manager calls
- **Production:** Uses Secrets Manager → Fetches password on first connection → Cached in `process.env`

---

### 5. Build Lambda Functions (TypeScript to JavaScript)

**CRITICAL:** Lambda functions require JavaScript, not TypeScript. We must compile all TypeScript files to JavaScript before deployment.

**Step 5.1: Navigate to lambdas directory**

```bash
cd lambdas
```

**Step 5.2: Run the build script**

```bash
./build-lambdas.sh
```

**Expected output:**
```
🔨 Building Lambda functions...
📦 Building createAsset...
  ✅ createAsset compiled successfully
📦 Building getAsset...
  ✅ getAsset compiled successfully
📦 Building listAssets...
  ✅ listAssets compiled successfully
📦 Building updateAsset...
  ✅ updateAsset compiled successfully
📦 Building deleteAsset...
  ✅ deleteAsset compiled successfully
📦 Building syncSchema...
  ✅ syncSchema compiled successfully

✨ All Lambda functions built successfully!

Next step: Deploy with 'npx ampx sandbox' from the asset-management-app directory
```

**What this does:**
- Compiles TypeScript (.ts) files to JavaScript (.js) files
- Excludes test files from compilation
- Creates JavaScript files in `functions/<functionName>/functions/<functionName>/index.js`
- Preserves shared code structure

**Step 5.3: Verify JavaScript files were created**

```bash
# Check that index.js files exist
ls -la functions/createAsset/functions/createAsset/index.js
ls -la functions/syncSchema/functions/syncSchema/index.js
```

**Expected output:**
```
-rw-r--r--  1 user  staff  3688 Feb  9 04:42 functions/createAsset/functions/createAsset/index.js
-rw-r--r--  1 user  staff  1265 Feb  9 04:42 functions/syncSchema/functions/syncSchema/index.js
```

**Step 5.4: Return to asset-management-app directory**

```bash
cd ..
```

---

### 6. Deploy the Updated Backend

Now deploy everything (RDS + Lambda + API Gateway):

```bash
npx ampx sandbox
```

**This will:**
1. Update the existing RDS deployment (no changes)
2. Create Lambda functions
3. Configure VPC access for Lambda
4. Create API Gateway
5. Set up routes and integrations
6. Deploy everything

**Expected output:**
```
✨ Amplify Sandbox

Deploying resources...
  ✓ VPC (no changes)
  ✓ RDS MySQL (no changes)
  ✓ Lambda functions created (6 functions)
  ✓ API Gateway created
  ✓ Routes configured

✅ Deployment complete!

📝 API Gateway URL: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod

Lambda Functions:
  - asset-management-createAsset
  - asset-management-getAsset
  - asset-management-listAssets
  - asset-management-updateAsset
  - asset-management-deleteAsset
  - asset-management-syncSchema
```

**Save the API Gateway URL!**

---

### 7. Sync Database Schema

Before testing the API, we need to create the database tables. 

**IMPORTANT:** The sync-schema endpoint runs asynchronously to avoid API Gateway timeout limits (29 seconds max). The API will return immediately with HTTP 202, and the Lambda will continue running in the background for up to 5 minutes.

**Step 7.1: Call the sync-schema endpoint**

```bash
# Replace with your actual API Gateway URL
API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"

curl -X POST "$API_URL/admin/sync-schema" \
  -H "Content-Type: application/json" \
  | jq
```

**Expected output (returns immediately):**
```json
{
  "message": "Database sync started in background. Check CloudWatch logs for progress.",
  "logGroup": "/aws/lambda/asset-management-syncSchema"
}
```

**HTTP Status:** 202 Accepted (indicates async processing)

**Step 7.2: Monitor the Lambda execution in CloudWatch Logs**

The sync process runs in the background. Monitor progress:

```bash
# View logs for sync-schema function (wait 10-30 seconds for logs to appear)
aws logs tail /aws/lambda/asset-management-syncSchema --follow
```

**Expected log output:**
```
START RequestId: xxx-xxx-xxx
🔐 Fetching database credentials from AWS Secrets Manager...
✅ Secret fetched and cached: your-secret-name
🔌 Connecting to database...
✅ Database connection successful
🔄 Syncing database schema...
✅ Database schema synced successfully
END RequestId: xxx-xxx-xxx
```

**Step 7.3: Verify tables were created**

Once the logs show success, verify the tables exist:

```bash
# Connect to RDS (use your actual endpoint)
mysql -h your-rds-endpoint.rds.amazonaws.com -u admin -p HeraTraining

# List tables
SHOW TABLES;
```

**Expected output:**
```
+------------------------+
| Tables_in_HeraTraining |
+------------------------+
| Assets                 |
+------------------------+
```

**Troubleshooting:**
- If no logs appear after 30 seconds, check the Lambda function exists in AWS Console
- If sync fails, check CloudWatch logs for error details
- Common issues: VPC connectivity, Secrets Manager permissions, database credentials
- **ETIMEDOUT errors connecting to Secrets Manager:** The VPC endpoint for Secrets Manager should be automatically created. If you see timeout errors, verify the VPC endpoint exists in AWS Console → VPC → Endpoints
```

---

### 8. Test API Endpoints

Now test all the CRUD endpoints:

**Test 1: Create an asset**
```bash
curl -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "user-123",
    "name": "Test Asset from AWS",
    "description": "Testing deployed Lambda",
    "category": "image",
    "imageKey": "assets/user-123/test.jpg"
  }' | jq
```

**Expected:** 200 OK with asset data including `id`

**Test 2: List assets**
```bash
curl "$API_URL/assets" | jq
```

**Expected:** Array of assets

**Test 3: Get asset by ID**
```bash
# Replace ASSET_ID with the ID from Test 1
ASSET_ID="your-asset-id-here"
curl "$API_URL/assets/$ASSET_ID" | jq
```

**Expected:** Asset details

**Test 4: Update asset**
```bash
curl -X PATCH "$API_URL/assets/$ASSET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Asset Name",
    "description": "Updated from AWS"
  }' | jq
```

**Expected:** Updated asset data

**Test 5: Delete asset**
```bash
curl -X DELETE "$API_URL/assets/$ASSET_ID"
```

**Expected:** 204 No Content

---

### 8. Monitor with CloudWatch

View Lambda logs in CloudWatch:

**Using AWS CLI:**
```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/asset-management

# Tail logs for a specific function
aws logs tail /aws/lambda/asset-management-createAsset --follow

# View recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/asset-management-createAsset \
  --filter-pattern "ERROR" \
  --max-items 10
```

**Using AWS Console:**
1. Go to CloudWatch → Log groups
2. Find `/aws/lambda/asset-management-*`
3. Click on a log group to view logs
4. Use filters to search for errors

---

### 9. Test Error Handling

Test validation and error scenarios:

**Test: Missing required field**
```bash
curl -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "user-123",
    "category": "image"
  }' | jq
```

**Expected:** 400 Bad Request with validation error

**Test: Invalid category**
```bash
curl -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "user-123",
    "name": "Test",
    "category": "invalid-category"
  }' | jq
```

**Expected:** 400 Bad Request with category validation error

**Test: Non-existent asset**
```bash
curl "$API_URL/assets/00000000-0000-0000-0000-000000000000" | jq
```

**Expected:** 404 Not Found

---

### 10. Update Frontend Configuration

Update the frontend to use the deployed API:

```bash
cd frontend
```

Create or update `src/config/api.js`:

```javascript
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'https://xxxxx.execute-api.us-east-1.amazonaws.com/prod',
  endpoints: {
    assets: '/assets',
    asset: (id) => `/assets/${id}`,
  },
}
```

Update `.env` file:

```bash
VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

**Replace with your actual API Gateway URL!**

---

## ✅ Verification Checklist

Before moving forward, verify:

- [ ] Lambda functions deployed successfully
- [ ] API Gateway created with correct routes
- [ ] Database schema synced (tables created)
- [ ] Create asset endpoint works
- [ ] List assets endpoint works
- [ ] Get asset by ID endpoint works
- [ ] Update asset endpoint works
- [ ] Delete asset endpoint works
- [ ] Error handling works correctly
- [ ] CloudWatch logs are accessible
- [ ] API Gateway URL saved

---

## 🔍 Understanding What You Built

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Gateway (REST API)                  │  │
│  │  https://xxxxx.execute-api.us-east-1.amazonaws.com  │  │
│  │                                                       │  │
│  │  POST   /assets           → createAsset Lambda      │  │
│  │  GET    /assets           → listAssets Lambda       │  │
│  │  GET    /assets/{id}      → getAsset Lambda         │  │
│  │  PATCH  /assets/{id}      → updateAsset Lambda      │  │
│  │  DELETE /assets/{id}      → deleteAsset Lambda      │  │
│  │  POST   /admin/sync-schema → syncSchema Lambda      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Lambda Functions                    │  │
│  │                  (in VPC)                            │  │
│  │                                                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ createAsset│  │  getAsset  │  │ listAssets │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │updateAsset │  │deleteAsset │  │ syncSchema │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │                                                       │  │
│  │  Environment Variables:                              │  │
│  │  - DB_HOST, DB_PORT, DB_NAME                        │  │
│  │  - DB_SECRET_NAME (Secrets Manager)                 │  │
│  │  - AWS_REGION, NODE_ENV                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    VPC                                │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌──────────────────────┐  │  │
│  │  │ Private Subnet  │      │  Private Subnet      │  │  │
│  │  │                 │      │                      │  │  │
│  │  │  ┌───────────┐  │      │                      │  │  │
│  │  │  │    RDS    │◄─┼──────┼─ Lambda Functions    │  │  │
│  │  │  │   MySQL   │  │      │                      │  │  │
│  │  │  └───────────┘  │      │                      │  │  │
│  │  └─────────────────┘      └──────────────────────┘  │  │
│  │                                                       │  │
│  │  Security Group: Allow port 3306 from Lambda        │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AWS Secrets Manager                     │  │
│  │  Secret: amplify-heratraining-db-credentials        │  │
│  │  (Database password)                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  CloudWatch Logs                     │  │
│  │  /aws/lambda/asset-management-*                      │  │
│  │  (All Lambda execution logs)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Lambda in VPC

**Why Lambda needs VPC access:**
- RDS is in private subnet (not publicly accessible)
- Lambda must be in same VPC to connect to RDS
- Security best practice

**VPC Configuration:**
- Lambda functions deployed in private subnets
- Security group allows outbound to RDS (port 3306)
- RDS security group allows inbound from Lambda

**Trade-offs:**
- ✅ Secure (RDS not exposed to internet)
- ✅ Low latency (same VPC)
- ❌ Cold start slightly slower (VPC ENI creation)
- ❌ No internet access (need NAT Gateway or VPC endpoints)

---

## 🎓 Key Concepts

### 1. Lambda Cold Starts

**What is a cold start?**
- First invocation after deployment or idle period
- Lambda creates execution environment
- Loads code and dependencies
- Establishes VPC connection (if in VPC)

**Cold start times:**
- Without VPC: ~100-500ms
- With VPC: ~1-3 seconds (first time)
- Warm invocations: ~10-50ms

**Optimization strategies:**
- Keep functions small
- Minimize dependencies
- Use provisioned concurrency (costs money)
- Connection pooling (reuse DB connections)

### 2. API Gateway Integration

**Lambda Proxy Integration:**
- API Gateway passes entire request to Lambda
- Lambda returns formatted response
- Full control over response format

**Response format:**
```typescript
{
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify({ data: {...} })
}
```

### 3. Environment Variables vs Secrets Manager

**When to use Environment Variables:**
- Non-sensitive configuration
- API endpoints, feature flags
- Fast access (no API call)

**When to use Secrets Manager:**
- Database passwords
- API keys
- Certificates
- Automatic rotation support

**Best Practice:**
- Store secret NAME in environment variable
- Retrieve secret VALUE from Secrets Manager at runtime
- Cache secret value (with TTL)

### 4. Lambda Execution Role

**Permissions needed:**
- VPC access (ENI creation)
- CloudWatch Logs (write logs)
- Secrets Manager (read secrets)
- RDS (network access via security group)

**Managed Policies:**
- `AWSLambdaVPCAccessExecutionRole` - VPC access
- `AWSLambdaBasicExecutionRole` - CloudWatch Logs

---

## 📝 Notes

- Lambda functions are in private subnets (same as RDS)
- API Gateway is public (accessible from internet)
- Database password retrieved from Secrets Manager
- CloudWatch Logs retention: 7 days (default)
- API Gateway stage: `prod`
- Lambda timeout: 30 seconds (60 for schema sync)
- Lambda memory: 256 MB (adjust based on needs)
- CORS enabled for all origins (restrict in production)

---

## 🎯 What's Next?

You've completed the backend deployment! Next steps:

1. **Frontend Integration** - Connect Vue.js app to deployed API
2. **Authentication** - Add Cognito authentication to API Gateway
3. **S3 Integration** - Implement image upload to S3
4. **Monitoring** - Set up CloudWatch alarms
5. **CI/CD** - Automate deployments with GitHub Actions

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.8! 🎉

**You now have:**
- ✅ Lambda functions deployed in AWS
- ✅ VPC access to RDS MySQL configured
- ✅ API Gateway REST API with all CRUD endpoints
- ✅ Database schema synced
- ✅ All endpoints tested and working
- ✅ CloudWatch monitoring enabled
- ✅ Production-ready backend infrastructure!

---

**Congratulations!** Your backend is fully deployed and operational! 🚀
