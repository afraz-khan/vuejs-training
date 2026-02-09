# Guide Updates Summary

## Overview
Updated guides to include proper AWS Secrets Manager integration for production Lambda deployments.

## Files Updated

### 1. STEP_1.3.3_GUIDE.md
**Changes:**
- Added note at the end warning that code will be updated in Step 1.3.8
- Clarified that current implementation is for local development
- Listed specific files that will be updated for production

**Why:**
- Users following Step 1.3.3 will create basic connection helpers
- They need to know these will be enhanced later for production
- Prevents confusion when they see different code in Step 1.3.8

### 2. STEP_1.3.8_GUIDE.md
**Major Changes:**
- Added new **Step 2**: "Update Shared Code for Secrets Manager Integration"
- Renumbered all subsequent steps (3→4, 4→5, etc.)
- Provides complete code for 4 files that need updating

**New Step 2 Includes:**

#### Step 2.1: Update env.ts
- Adds `getDbCredentials()` function
- Fetches password from Secrets Manager in production
- Falls back to environment variables in development
- Includes error handling and fallback logic

#### Step 2.2: Update database.ts
- Makes `getDatabaseConfig()` async
- Calls `getDbCredentials()` to get credentials
- Returns Promise<Options> instead of Options

#### Step 2.3: Update models/index.ts
- Keeps synchronous initialization
- Uses environment variables for initial config
- Actual credentials fetched in dbHelper

#### Step 2.4: Update dbHelper.ts
- Fetches credentials from Secrets Manager before connecting
- Updates Sequelize config with fetched credentials
- Caches credentials for Lambda container reuse
- Adds `credentialsFetched` flag

#### Step 2.5: Verify the changes
- Commands to verify files were updated correctly
- Checks for presence of new functions

**Step 4 (formerly Step 3):**
- Updated to show actual runtime code
- Shows `getDbCredentials()` function in env.ts
- Shows how dbHelper.ts calls it
- Explains the complete flow from Lambda start to database connection

## Code Changes Made

### lambdas/shared/src/config/env.ts
```typescript
// Added new function:
export async function getDbCredentials() {
  // Fetches from Secrets Manager in production
  // Uses environment variables in development
}
```

### lambdas/shared/src/config/database.ts
```typescript
// Changed from:
export function getDatabaseConfig(): Options

// To:
export async function getDatabaseConfig(): Promise<Options>
```

### lambdas/shared/src/models/index.ts
```typescript
// Simplified to use synchronous initialization
// Removed getDatabaseConfig() call
// Uses env vars directly for initial config
```

### lambdas/shared/src/config/dbHelper.ts
```typescript
// Added:
let credentialsFetched = false

// In connectToDatabase():
if (env.NODE_ENV === 'production' && env.DB_SECRET_NAME && !credentialsFetched) {
  const credentials = await getDbCredentials()
  // Update sequelize.config with fetched credentials
}
```

## How It Works

### Development (Local)
1. Load `.env` file
2. Use environment variables for all credentials
3. Connect to database
4. No Secrets Manager calls

### Production (AWS Lambda)
1. Lambda starts with environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_SECRET_NAME)
2. `connectToDatabase()` is called
3. Detects production environment and DB_SECRET_NAME
4. Calls `getDbCredentials()` → Fetches from AWS Secrets Manager
5. Updates Sequelize config with fetched password
6. Connects to database
7. Credentials cached for subsequent invocations (Lambda container reuse)

## Benefits

1. **Security**: Database password never in environment variables or code
2. **Flexibility**: Same code works in development and production
3. **Performance**: Credentials cached for Lambda container reuse
4. **Reliability**: Fallback to environment variables if Secrets Manager fails
5. **Clarity**: Users see exact code that runs in production

## Testing

Users can verify the integration by:
1. Checking file contents with grep commands
2. Running local tests (uses .env)
3. Deploying to AWS (uses Secrets Manager)
4. Checking CloudWatch logs for "Fetching credentials from Secrets Manager" message

## Next Steps for Users

After completing Step 1.3.8:
1. All shared code updated with Secrets Manager integration
2. Lambda functions prepared for deployment
3. Ready to deploy with `npx ampx sandbox`
4. Database credentials automatically fetched from Secrets Manager in production

---

**Last Updated:** Step 1.3.8 guide now includes complete Secrets Manager integration with actual runtime code examples.
