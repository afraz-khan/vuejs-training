# Step 1.3.9: Configure DynamoDB Schema with Amplify Data (GraphQL API)

## Overview
In this step, you'll set up DynamoDB tables using Amplify Gen 2's data resource. This creates an AWS AppSync GraphQL API that automatically manages DynamoDB tables for asset tags, status tracking, and activity logging.

**What you'll build:**
- DynamoDB tables via GraphQL schema
- AWS AppSync GraphQL API
- Authorization rules for authenticated users
- GraphQL queries and mutations

**Why DynamoDB for these features?**
- **Tags**: Flexible, schema-less data (users can add any tags)
- **Status**: Frequently updated, fast reads/writes
- **Activity Logs**: High-volume writes, time-series data

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vue 3 Frontend                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ GraphQL Queries/Mutations
                     │
┌────────────────────▼────────────────────────────────────┐
│              AWS AppSync (GraphQL API)                  │
│  - Auto-generated from schema                           │
│  - Built-in authentication                              │
│  - Real-time subscriptions (optional)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Resolvers
                     │
┌────────────────────▼────────────────────────────────────┐
│                    DynamoDB Tables                      │
│  - AssetTag (tags for assets)                          │
│  - AssetStatus (status tracking)                       │
│  - ActivityLog (audit trail)                           │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Completed Step 1.3.8 (Lambda + API Gateway deployed)
- Amplify sandbox running or ready to deploy
- Understanding of GraphQL basics (queries, mutations)

---

## Step 1: Understand the Data Models

### AssetTag Model
Stores flexible tags for assets (key-value pairs).

**Fields:**
- `id`: Auto-generated unique ID
- `assetId`: Links to asset in RDS (string)
- `tagName`: Tag key (e.g., "department", "location")
- `tagValue`: Tag value (e.g., "IT", "Building A")
- `createdBy`: User who created the tag
- `createdAt`: Timestamp

**Example:**
```json
{
  "id": "tag-123",
  "assetId": "asset-456",
  "tagName": "department",
  "tagValue": "IT",
  "createdBy": "user-789",
  "createdAt": "2026-02-09T10:00:00Z"
}
```

### AssetStatus Model
Tracks asset lifecycle status.

**Fields:**
- `id`: Auto-generated unique ID
- `assetId`: Links to asset in RDS
- `status`: Enum (active, archived, maintenance, deleted)
- `statusNote`: Optional note about status change
- `updatedBy`: User who updated status
- `updatedAt`: Timestamp

**Example:**
```json
{
  "id": "status-123",
  "assetId": "asset-456",
  "status": "maintenance",
  "statusNote": "Scheduled maintenance",
  "updatedBy": "user-789",
  "updatedAt": "2026-02-09T10:00:00Z"
}
```

### ActivityLog Model
Audit trail for asset operations.

**Fields:**
- `id`: Auto-generated unique ID
- `assetId`: Links to asset in RDS
- `action`: Enum (created, viewed, updated, deleted)
- `performedBy`: User who performed action
- `details`: Optional details about the action
- `timestamp`: When action occurred

**Example:**
```json
{
  "id": "log-123",
  "assetId": "asset-456",
  "action": "viewed",
  "performedBy": "user-789",
  "details": "Viewed from mobile app",
  "timestamp": "2026-02-09T10:00:00Z"
}
```

---

## Step 2: Update the Data Schema

**Important:** You need to update TWO files for the data resource to work.

### 2.1: Update the Data Schema

Open `amplify/data/resource.ts` and replace its contents:

```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

const schema = a.schema({
  // Asset Tags - flexible tagging system
  AssetTag: a
    .model({
      assetId: a.string().required(),
      tagName: a.string().required(),
      tagValue: a.string(),
      createdBy: a.string(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Asset Status - track asset lifecycle
  AssetStatus: a
    .model({
      assetId: a.string().required(),
      status: a.enum(['active', 'archived', 'maintenance', 'deleted']),
      statusNote: a.string(),
      updatedBy: a.string(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Activity Log - audit trail
  ActivityLog: a
    .model({
      assetId: a.string().required(),
      action: a.enum(['created', 'viewed', 'updated', 'deleted']),
      performedBy: a.string(),
      details: a.string(),
      timestamp: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})
```

**What this does:**
- Defines 3 DynamoDB tables via GraphQL schema
- Sets authorization: only authenticated users can access
- Auto-generates GraphQL queries, mutations, and subscriptions
- Creates DynamoDB tables with proper indexes

### 2.2: Register Data Resource in Backend

Open `amplify/backend.ts` and add the data import and registration:

**Add this import at the top:**
```typescript
import { data } from './data/resource'
```

**Update the defineBackend call to include data:**
```typescript
const backend = defineBackend({
  auth,
  storage,
  data,  // ← Add this line
})
```

**Why this is needed:**
- The data resource must be registered in `backend.ts` to be deployed
- Without this, the DynamoDB tables won't be created
- This connects the GraphQL schema to your Amplify backend

---

## Step 3: Deploy the Schema

### Option A: Using Sandbox (Development)

If your sandbox is already running, it will auto-detect the changes and redeploy.

If not running:

```bash
# From asset-management-app directory
npx ampx sandbox
```

**Expected output:**
```
✨ Amplify Sandbox

Deploying resources...
  ✓ Auth (no changes)
  ✓ Storage (no changes)
  ✓ Data - Creating AppSync API
  ✓ Data - Creating DynamoDB tables
    - AssetTag table created
    - AssetStatus table created
    - ActivityLog table created
  ✓ Lambda functions (no changes)
  ✓ API Gateway (no changes)

✅ Deployment complete!

📝 GraphQL API Endpoint: https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql
```

### Option B: Production Deployment

```bash
npx ampx deploy --branch main
```

---

## Step 4: Verify DynamoDB Tables

### Check in AWS Console

1. Go to AWS Console → DynamoDB
2. Look for tables with names like:
   - `AssetTag-<sandbox-id>-<env>`
   - `AssetStatus-<sandbox-id>-<env>`
   - `ActivityLog-<sandbox-id>-<env>`

### Check AppSync API

1. Go to AWS Console → AppSync
2. Find your API (name includes your project name)
3. Click "Queries" to open GraphQL playground

---

## Step 5: Test GraphQL API

**Important:** The GraphQL API requires authentication because of the `.authorization((allow) => [allow.authenticated()])` rule in the schema. You cannot test directly in the AppSync console without authentication.

### 5.1: Create a Test User in Cognito

First, you need a Cognito user to authenticate with.

**Get your User Pool ID:**
```bash
cat amplify_outputs.json | grep user_pool_id
```

**Create a test user:**
```bash
# Replace YOUR_USER_POOL_ID with the actual ID from above
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --message-action SUPPRESS

# Set a permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com \
  --password TestPassword123! \
  --permanent
```

**Expected output:**
```json
{
  "User": {
    "Username": "test@example.com",
    "Enabled": true,
    "UserStatus": "CONFIRMED"
  }
}
```

### 5.2: Create Test Script

Create `test-graphql.js` in the `asset-management-app` directory:

```javascript
/**
 * Test GraphQL API with authentication
 * 
 * Usage:
 * 1. Make sure you have a Cognito user created (see Step 5.1)
 * 2. Update EMAIL and PASSWORD below
 * 3. Run: npm run test:graphql
 */

import { Amplify } from 'aws-amplify'
import { signIn } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/data'
import { readFileSync } from 'fs'

// Load amplify outputs
const outputs = JSON.parse(readFileSync('./amplify_outputs.json', 'utf-8'))

// Configure Amplify
Amplify.configure(outputs)

// Create GraphQL client
const client = generateClient()

// UPDATE THESE WITH YOUR COGNITO USER CREDENTIALS
const EMAIL = 'test@example.com'
const PASSWORD = 'TestPassword123!'

async function testGraphQL() {
  try {
    console.log('🔐 Signing in...')
    await signIn({
      username: EMAIL,
      password: PASSWORD
    })
    console.log('✅ Signed in successfully\n')

    // Test 1: Create AssetTag
    console.log('📝 Creating AssetTag...')
    const { data: tag, errors: createErrors } = await client.models.AssetTag.create({
      assetId: 'test-asset-123',
      tagName: 'department',
      tagValue: 'IT',
      createdBy: 'test-user',
      createdAt: new Date().toISOString()
    })

    if (createErrors) {
      console.error('❌ Error creating tag:', createErrors)
      return
    }

    console.log('✅ Tag created:', tag)
    console.log()

    // Test 2: List AssetTags
    console.log('📋 Listing AssetTags...')
    const { data: tags, errors: listErrors } = await client.models.AssetTag.list({
      filter: { assetId: { eq: 'test-asset-123' } }
    })

    if (listErrors) {
      console.error('❌ Error listing tags:', listErrors)
      return
    }

    console.log('✅ Tags found:', tags.length, 'tag(s)')
    console.log()

    // Test 3: Create AssetStatus
    console.log('📊 Creating AssetStatus...')
    const { data: status, errors: statusErrors } = await client.models.AssetStatus.create({
      assetId: 'test-asset-123',
      status: 'active',
      statusNote: 'Asset is operational',
      updatedBy: 'test-user',
      updatedAt: new Date().toISOString()
    })

    if (statusErrors) {
      console.error('❌ Error creating status:', statusErrors)
      return
    }

    console.log('✅ Status created:', status)
    console.log()

    // Test 4: Create ActivityLog
    console.log('📜 Creating ActivityLog...')
    const { data: activity, errors: activityErrors } = await client.models.ActivityLog.create({
      assetId: 'test-asset-123',
      action: 'viewed',
      performedBy: 'test-user',
      details: 'Viewed from test script',
      timestamp: new Date().toISOString()
    })

    if (activityErrors) {
      console.error('❌ Error creating activity:', activityErrors)
      return
    }

    console.log('✅ Activity logged:', activity)
    console.log()

    console.log('🎉 All tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testGraphQL()
```

### 5.3: Update package.json

Add `"type": "module"` and a test script to `package.json`:

```json
{
  "name": "asset-management-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test:graphql": "node test-graphql.js"
  }
}
```

### 5.4: Run the Test

```bash
npm run test:graphql
```

**Expected output:**
```
🔐 Signing in...
✅ Signed in successfully

📝 Creating AssetTag...
✅ Tag created: {
  id: 'abc-123-def',
  assetId: 'test-asset-123',
  tagName: 'department',
  tagValue: 'IT',
  createdBy: 'test-user',
  createdAt: '2026-02-09T10:00:00.000Z'
}

📋 Listing AssetTags...
✅ Tags found: 1 tag(s)

📊 Creating AssetStatus...
✅ Status created: {
  id: 'xyz-456-abc',
  assetId: 'test-asset-123',
  status: 'active',
  statusNote: 'Asset is operational',
  updatedBy: 'test-user',
  updatedAt: '2026-02-09T10:00:00.000Z'
}

📜 Creating ActivityLog...
✅ Activity logged: {
  id: 'log-789-ghi',
  assetId: 'test-asset-123',
  action: 'viewed',
  performedBy: 'test-user',
  details: 'Viewed from test script',
  timestamp: '2026-02-09T10:00:00.000Z'
}

🎉 All tests passed!
```

### 5.5: Verify in AWS Console

After running the test, verify the data was created:

1. Go to AWS Console → DynamoDB
2. Find your tables (AssetTag, AssetStatus, ActivityLog)
3. Click "Explore table items"
4. You should see the test data created by the script

---

## Step 5 (Alternative): Test Without Authentication (Quick Test Only)

If you just want to quickly verify the schema works without setting up authentication:

### Temporarily Change Authorization

In `amplify/data/resource.ts`, change:
```typescript
.authorization((allow) => [allow.authenticated()])
```

To:
```typescript
.authorization((allow) => [allow.publicApiKey()])
```

Then redeploy and test in AppSync console. **Remember to change it back** to `.authenticated()` when done.

---

## Step 6: Understand Generated GraphQL Operations

Amplify automatically generates these operations for each model:

### Queries (Read Operations)

```graphql
# Get single item by ID
query GetAssetTag {
  getAssetTag(id: "tag-id") {
    id
    assetId
    tagName
    tagValue
  }
}

# List all items (with optional filter)
query ListAssetTags {
  listAssetTags(filter: { assetId: { eq: "asset-123" } }) {
    items {
      id
      tagName
      tagValue
    }
    nextToken  # For pagination
  }
}
```

### Mutations (Write Operations)

```graphql
# Create
mutation CreateAssetTag {
  createAssetTag(input: { assetId: "...", tagName: "..." }) {
    id
    assetId
  }
}

# Update
mutation UpdateAssetTag {
  updateAssetTag(input: { id: "tag-id", tagValue: "new-value" }) {
    id
    tagValue
  }
}

# Delete
mutation DeleteAssetTag {
  deleteAssetTag(input: { id: "tag-id" }) {
    id
  }
}
```

### Subscriptions (Real-time Updates - Optional)

```graphql
subscription OnCreateAssetTag {
  onCreateAssetTag {
    id
    assetId
    tagName
    tagValue
  }
}
```

---

## Step 7: Export GraphQL Endpoint for Frontend

The GraphQL endpoint is automatically included in `amplify_outputs.json`.

Verify it exists:

```bash
cat amplify_outputs.json | grep graphql
```

**Expected output:**
```json
{
  "data": {
    "url": "https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql",
    "aws_region": "us-east-1",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS"
  }
}
```

This file is automatically used by the Amplify client library in the frontend.

---

## Step 8: Understanding Authorization

### How Authorization Works

```typescript
.authorization((allow) => [allow.authenticated()])
```

This means:
- ✅ Any authenticated user can create, read, update, delete
- ❌ Unauthenticated users cannot access the data
- ❌ Public access is not allowed

### Why This Authorization?

For this application:
- Users should only manage tags/status/logs for **their own assets**
- Authorization is enforced in **two layers**:
  1. **AppSync**: Requires authentication
  2. **Frontend**: Validates asset ownership before operations

### Frontend Validation Pattern

```javascript
// Before adding a tag to an asset
async function addTag(assetId, tagName, tagValue) {
  // 1. Verify user owns the asset (call RDS API)
  const asset = await fetchAssetById(assetId)
  if (asset.ownerId !== currentUserId) {
    throw new Error('You do not own this asset')
  }
  
  // 2. Add tag (call GraphQL API)
  await createAssetTag({ assetId, tagName, tagValue })
}
```

---

## Common GraphQL Patterns

### Pattern 1: Filter by Asset ID

```graphql
query GetAssetTags($assetId: String!) {
  listAssetTags(filter: { assetId: { eq: $assetId } }) {
    items {
      id
      tagName
      tagValue
    }
  }
}
```

**Variables:**
```json
{
  "assetId": "asset-123"
}
```

### Pattern 2: Get Latest Status

```graphql
query GetLatestStatus($assetId: String!) {
  listAssetStatuses(
    filter: { assetId: { eq: $assetId } }
    limit: 1
  ) {
    items {
      id
      status
      statusNote
      updatedAt
    }
  }
}
```

### Pattern 3: Get Activity Logs (Sorted by Time)

```graphql
query GetActivityLogs($assetId: String!) {
  listActivityLogs(
    filter: { assetId: { eq: $assetId } }
    limit: 50
  ) {
    items {
      id
      action
      performedBy
      details
      timestamp
    }
  }
}
```

---

## Troubleshooting

### Issue: "Request failed with status code 401" or "Unauthorized" error

**Cause:** The GraphQL API requires authentication (`.authorization((allow) => [allow.authenticated()])`).

**Solution:** 
- You cannot test directly in AppSync console without authentication
- Use the test script from Step 5 which handles authentication
- Or temporarily change to `.authorization((allow) => [allow.publicApiKey()])` for quick testing (remember to change back)

### Issue: "data resource not deployed" or "no DynamoDB tables created"

**Cause:** The data resource is not registered in `backend.ts`.

**Solution:**
1. Open `amplify/backend.ts`
2. Add import: `import { data } from './data/resource'`
3. Add to defineBackend: `defineBackend({ auth, storage, data })`
4. Restart sandbox: `npx ampx sandbox`

### Issue: Test script error "Unexpected identifier 'assert'"

**Cause:** Import assertion syntax not supported in your Node.js version.

**Solution:**
1. Make sure `package.json` has `"type": "module"`
2. Use `readFileSync` to load JSON instead of import assertion
3. See Step 5.2 for the correct test script code

### Issue: Tables not created

**Solution:**
```bash
# Check sandbox logs
npx ampx sandbox

# Look for errors in deployment
# Common issue: syntax error in schema
```

### Issue: Can't find GraphQL endpoint

**Solution:**
```bash
# Regenerate amplify_outputs.json
npx ampx sandbox

# Check the file
cat amplify_outputs.json
```

### Issue: Schema changes not deploying

**Solution:**
```bash
# Stop sandbox
# Delete .amplify/artifacts directory
rm -rf .amplify/artifacts

# Restart sandbox
npx ampx sandbox
```

---

## Verification Checklist

Before moving to the next step, verify:

- [ ] `amplify/data/resource.ts` has all 3 models defined (AssetTag, AssetStatus, ActivityLog)
- [ ] `amplify/backend.ts` imports and registers the data resource
- [ ] `package.json` has `"type": "module"` added
- [ ] Sandbox deployed successfully (no errors in logs)
- [ ] 3 DynamoDB tables created in AWS Console
- [ ] AppSync API created in AWS Console
- [ ] Cognito test user created
- [ ] Test script (`test-graphql.js`) created
- [ ] Test script runs successfully (`npm run test:graphql`)
- [ ] Can create AssetTag via test script
- [ ] Can list AssetTags via test script
- [ ] Can create AssetStatus via test script
- [ ] Can create ActivityLog via test script
- [ ] `amplify_outputs.json` contains GraphQL endpoint
- [ ] Data visible in DynamoDB tables in AWS Console

---

## What's Next?

In **Step 1.4.1**, you'll:
- Create frontend services to call GraphQL API
- Set up Pinia stores for tags, status, and activity logs
- Integrate with the Vue 3 frontend

---

## Key Takeaways

✅ **DynamoDB via GraphQL** - Amplify Gen 2 makes it simple
✅ **Auto-generated API** - Queries, mutations, subscriptions created automatically
✅ **Type-safe** - TypeScript types generated from schema
✅ **Secure** - Authentication required by default
✅ **Scalable** - DynamoDB handles high-volume reads/writes
✅ **Flexible** - Perfect for tags, status, and logs

---

## Additional Resources

- [Amplify Data Documentation](https://docs.amplify.aws/gen2/build-a-backend/data/)
- [GraphQL Schema Design](https://docs.amplify.aws/gen2/build-a-backend/data/data-modeling/)
- [Authorization Rules](https://docs.amplify.aws/gen2/build-a-backend/data/customize-authz/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
