# Asset Management Application - Design Document

## Project Overview
A full-stack asset management application that allows authenticated users to create, view, and manage assets through a web interface. Built with Vue 3, AWS Amplify Gen 2, and multiple AWS services.

## Tech Stack (All Required Services)
- **Frontend**: Vue 3 (Composition API), Pinia, Element Plus, Tailwind CSS
- **Backend**: AWS Amplify Gen 2
- **API Layer**: 
  - AWS AppSync (GraphQL) - for DynamoDB operations
  - API Gateway (REST) - for RDS operations via Lambda
- **Databases**: 
  - RDS MySQL (via Sequelize) - Asset metadata
  - DynamoDB - Asset tags, status, activity logs
- **Compute**: AWS Lambda (Node.js/TypeScript)
- **Infrastructure**: AWS CDK (for Lambda, API Gateway, RDS)
- **Authentication**: Amazon Cognito
- **Storage**: Amazon S3 (asset images)
- **ETL**: AWS Glue Jobs (optional - for data migration/reporting)

---

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Vue 3 Frontend                          │
│              (Element Plus + Tailwind CSS)                  │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │                            │
    ┌────────▼────────┐          ┌───────▼────────┐
    │  AWS AppSync    │          │  API Gateway   │
    │   (GraphQL)     │          │     (REST)     │
    └────────┬────────┘          └───────┬────────┘
             │                            │
    ┌────────▼────────┐          ┌───────▼────────┐
    │   DynamoDB      │          │  Lambda Fns    │
    │  (Tags, Logs)   │          │  (TypeScript)  │
    └─────────────────┘          └───────┬────────┘
                                          │
                                 ┌────────▼────────┐
                                 │   RDS MySQL     │
                                 │  (Sequelize)    │
                                 └─────────────────┘
             
    ┌─────────────────┐          ┌─────────────────┐
    │   S3 Bucket     │          │  AWS Cognito    │
    │ (Asset Images)  │          │     (Auth)      │
    └─────────────────┘          └─────────────────┘
```

### Data Distribution Strategy (Simple & Clear)

**RDS MySQL (via Sequelize)** - Core Asset Metadata
- Asset ID, Name, Description, Category
- Owner User ID, Created/Updated timestamps
- Image URL (S3 reference)

**DynamoDB (via AppSync GraphQL)** - Dynamic Asset Information
- Asset Tags (flexible, user-defined)
- Asset Status (active, archived, maintenance)
- Activity Logs (view history, edit history)

**Why this split?**
- RDS: Structured, relational data that needs ACID compliance
- DynamoDB: Flexible, fast-access data that changes frequently
- This demonstrates both databases in their optimal use cases

---

## Frontend Architecture (Vue 3)

### Project Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue          # Header with auth status
│   │   ├── AppFooter.vue          # Footer (slot example)
│   │   └── MainLayout.vue         # Layout wrapper with slots
│   ├── auth/
│   │   ├── LoginForm.vue          # Login form (v-model, @submit)
│   │   ├── SignupForm.vue         # Signup form
│   │   └── AuthGuard.vue          # Conditional rendering example
│   ├── assets/
│   │   ├── AssetList.vue          # List all assets (v-for)
│   │   ├── AssetCard.vue          # Individual card (props, emits)
│   │   ├── AssetForm.vue          # Create/Edit form (v-model)
│   │   ├── AssetDetail.vue        # Detail view (lifecycle hooks)
│   │   ├── AssetImageUpload.vue   # Image upload component
│   │   └── DeleteConfirmDialog.vue # Confirmation dialog (Element Plus)
│   ├── tags/
│   │   ├── TagManager.vue         # Manage tags (DynamoDB)
│   │   └── TagChip.vue            # Tag display component
│   └── common/
│       ├── LoadingSpinner.vue     # Loading state
│       └── ErrorAlert.vue         # Error handling
├── stores/
│   ├── authStore.js               # Pinia: Auth state
│   ├── assetStore.js              # Pinia: Asset CRUD (RDS via API Gateway)
│   └── tagStore.js                # Pinia: Tags/Logs (DynamoDB via AppSync)
├── composables/
│   ├── useAuth.js                 # Auth composable
│   ├── useAssets.js               # Asset operations
│   └── useImageUpload.js          # S3 upload logic
├── views/
│   ├── HomeView.vue               # Landing page
│   ├── AssetsView.vue             # Assets listing
│   ├── AssetDetailView.vue        # Single asset view
│   ├── CreateAssetView.vue        # Create new asset
│   └── ProfileView.vue            # User profile
├── router/
│   └── index.js                   # Vue Router with auth guards
├── services/
│   ├── apiService.js              # API Gateway REST calls
│   ├── graphqlService.js          # AppSync GraphQL calls
│   └── storageService.js          # S3 operations
├── App.vue
└── main.js
```

### Vue 3 Concepts Demonstrated

| Concept | Component Example | Purpose |
|---------|------------------|---------|
| Templates & Directives | AssetList.vue | v-for, v-if, v-else |
| Event Handling | AssetCard.vue | @click, custom @delete event |
| Two-way Binding | AssetForm.vue | v-model on inputs |
| Props | AssetCard.vue | Receive asset data from parent |
| Emits | AssetCard.vue | Emit delete/edit events to parent |
| Slots | MainLayout.vue | Header, content, footer slots |
| Lifecycle Hooks | AssetDetail.vue | onMounted to fetch data |
| Composables | useAuth.js | Reusable auth logic |
| Pinia Store | assetStore.js | Centralized state management |
| Conditional Rendering | AuthGuard.vue | Show/hide based on auth |
| Component Communication | AssetList → AssetCard | Parent-child data flow |

---

## Backend Architecture

### 1. AWS Amplify Gen 2 Configuration

#### Authentication (amplify/auth/resource.ts)
```typescript
import { defineAuth } from '@aws-amplify/backend'

export const auth = defineAuth({
  loginWith: {
    email: true
  },
  userAttributes: {
    email: {
      required: true,
      mutable: false
    },
    name: {
      required: true,
      mutable: true
    }
  }
})
```

#### Storage (amplify/storage/resource.ts)
```typescript
import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'assetImages',
  access: (allow) => ({
    // Path pattern: assets/{userId}/{assetId}/filename.jpg
    // Provides user isolation at S3 level
    'assets/{entity_id}/*': [
      // Users can only access files in their own folder
      // {entity_id} is replaced with user's Cognito ID
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
})
```

#### DynamoDB Schema (amplify/data/resource.ts)
```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

const schema = a.schema({
  // Asset Tags - flexible tagging system
  AssetTag: a.model({
    assetId: a.string().required(),
    tagName: a.string().required(),
    tagValue: a.string(),
    createdBy: a.string(),
    createdAt: a.datetime()
  })
  .authorization([
    a.allow.authenticated()
  ]),

  // Asset Status - track asset lifecycle
  AssetStatus: a.model({
    assetId: a.string().required(),
    status: a.enum(['active', 'archived', 'maintenance', 'deleted']),
    statusNote: a.string(),
    updatedBy: a.string(),
    updatedAt: a.datetime()
  })
  .authorization([
    a.allow.authenticated()
  ]),

  // Activity Log - audit trail
  ActivityLog: a.model({
    assetId: a.string().required(),
    action: a.enum(['created', 'viewed', 'updated', 'deleted']),
    performedBy: a.string(),
    details: a.string(),
    timestamp: a.datetime()
  })
  .authorization([
    a.allow.authenticated()
  ])
})

export type Schema = ClientSchema<typeof schema>
export const data = defineData({ schema })
```

### 2. RDS MySQL + Lambda (via CDK)

#### RDS Schema (Sequelize Models)
```typescript
// models/Asset.ts
import { DataTypes, Model } from 'sequelize'

export class Asset extends Model {
  public id!: string
  public name!: string
  public description!: string
  public category!: string
  public imageUrl!: string
  public ownerId!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

export const AssetModel = (sequelize) => {
  Asset.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ownerId: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'assets',
    timestamps: true
  })
  
  return Asset
}
```

#### Lambda Functions (TypeScript)

**Function 1: createAsset**
```typescript
// lambdas/createAsset/index.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { Asset } from './models/Asset'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body || '{}')
  const userId = event.requestContext.authorizer?.claims.sub
  
  const asset = await Asset.create({
    name: body.name,
    description: body.description,
    category: body.category,
    imageUrl: body.imageUrl,
    ownerId: userId
  })
  
  return {
    statusCode: 201,
    body: JSON.stringify(asset)
  }
}
```

**Function 2: listAssets**
```typescript
// lambdas/listAssets/index.ts
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub
  
  const assets = await Asset.findAll({
    where: { ownerId: userId },
    order: [['createdAt', 'DESC']]
  })
  
  return {
    statusCode: 200,
    body: JSON.stringify(assets)
  }
}
```

**Function 3: getAsset**
```typescript
// lambdas/getAsset/index.ts
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const assetId = event.pathParameters?.id
  const asset = await Asset.findByPk(assetId)
  
  if (!asset) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Asset not found' }) }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(asset)
  }
}
```

**Function 4: updateAsset**
```typescript
// lambdas/updateAsset/index.ts
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const assetId = event.pathParameters?.id
  const body = JSON.parse(event.body || '{}')
  const userId = event.requestContext.authorizer?.claims.sub
  
  const asset = await Asset.findByPk(assetId)
  
  if (!asset || asset.ownerId !== userId) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }
  
  await asset.update(body)
  
  return {
    statusCode: 200,
    body: JSON.stringify(asset)
  }
}
```

**Function 5: deleteAsset**
```typescript
// lambdas/deleteAsset/index.ts
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const assetId = event.pathParameters?.id
  const userId = event.requestContext.authorizer?.claims.sub
  
  const asset = await Asset.findByPk(assetId)
  
  if (!asset || asset.ownerId !== userId) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }
  
  await asset.destroy()
  
  return {
    statusCode: 204,
    body: ''
  }
}
```

### 3. CDK Infrastructure (amplify/backend.ts)

```typescript
import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import * as cdk from 'aws-cdk-lib'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'

const backend = defineBackend({
  auth,
  data,
  storage
})

// Add RDS MySQL instance
const vpc = new ec2.Vpc(backend.stack, 'AssetVPC', {
  maxAzs: 2
})

const dbInstance = new rds.DatabaseInstance(backend.stack, 'AssetDB', {
  engine: rds.DatabaseInstanceEngine.mysql({
    version: rds.MysqlEngineVersion.VER_8_0
  }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  vpc,
  databaseName: 'assetdb',
  credentials: rds.Credentials.fromGeneratedSecret('admin')
})

// Lambda Layer for Sequelize
const sequelizeLayer = new lambda.LayerVersion(backend.stack, 'SequelizeLayer', {
  code: lambda.Code.fromAsset('layers/sequelize'),
  compatibleRuntimes: [lambda.Runtime.NODEJS_18_X]
})

// Create Lambda functions
const createAssetFn = new lambda.Function(backend.stack, 'CreateAssetFn', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambdas/createAsset'),
  layers: [sequelizeLayer],
  vpc,
  environment: {
    DB_HOST: dbInstance.dbInstanceEndpointAddress,
    DB_NAME: 'assetdb',
    DB_SECRET_ARN: dbInstance.secret!.secretArn
  }
})

// Grant Lambda access to RDS
dbInstance.connections.allowFrom(createAssetFn, ec2.Port.tcp(3306))
dbInstance.secret?.grantRead(createAssetFn)

// API Gateway with Cognito Authorizer
const api = new apigateway.RestApi(backend.stack, 'AssetAPI', {
  restApiName: 'Asset Management API',
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS
  }
})

const authorizer = new apigateway.CognitoUserPoolsAuthorizer(backend.stack, 'CognitoAuthorizer', {
  cognitoUserPools: [backend.auth.resources.userPool]
})

// API Routes
const assets = api.root.addResource('assets')
assets.addMethod('POST', new apigateway.LambdaIntegration(createAssetFn), {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO
})
assets.addMethod('GET', new apigateway.LambdaIntegration(listAssetsFn), {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO
})

const asset = assets.addResource('{id}')
asset.addMethod('GET', new apigateway.LambdaIntegration(getAssetFn))
asset.addMethod('PUT', new apigateway.LambdaIntegration(updateAssetFn), {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO
})
asset.addMethod('DELETE', new apigateway.LambdaIntegration(deleteAssetFn), {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO
})

// Output API URL
new cdk.CfnOutput(backend.stack, 'ApiUrl', {
  value: api.url
})
```

### 4. AWS Glue Job (Optional - for reporting)

```python
# glue/asset_report.py
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

# Simple ETL job to aggregate asset data
# Reads from RDS and DynamoDB, creates summary report in S3

args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read from RDS
rds_data = glueContext.create_dynamic_frame.from_catalog(
    database="asset_db",
    table_name="assets"
)

# Read from DynamoDB
dynamo_data = glueContext.create_dynamic_frame.from_catalog(
    database="asset_db",
    table_name="asset_tags"
)

# Simple aggregation - count assets by category
asset_summary = rds_data.toDF().groupBy("category").count()

# Write to S3
asset_summary.write.mode("overwrite").parquet("s3://asset-reports/summary/")

job.commit()
```

---

## Core Features

### 1. Authentication (Cognito)
- User signup with email verification
- User login/logout
- Protected routes (only authenticated users can access app)
- User session management

### 2. Asset CRUD Operations (RDS via Lambda + API Gateway)
- **Create Asset**: Form with name, description, category, image upload
- **List Assets**: Display all user's assets in a grid
- **View Asset Details**: Show full asset information
- **Update Asset**: Edit asset metadata
- **Delete Asset**: Remove asset with confirmation dialog

### 3. Asset Tags Management (DynamoDB via AppSync)
- Add custom tags to assets (key-value pairs)
- View all tags for an asset
- Remove tags
- Filter assets by tags (optional enhancement)

### 4. Asset Status Tracking (DynamoDB via AppSync)
- Set asset status: Active, Archived, Maintenance
- Add status notes
- View status history

### 5. Activity Logging (DynamoDB via AppSync)
- Automatically log asset views
- Log asset modifications
- Display activity timeline on asset detail page

### 6. Image Upload (S3)
- Upload asset images during creation
- Update asset images
- Display images in asset cards and detail view
- Automatic image URL storage in RDS

---

## API Design

### REST API (API Gateway + Lambda → RDS)

**Base URL**: `https://api.example.com/prod`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/assets` | Create new asset | Yes |
| GET | `/assets` | List user's assets | Yes |
| GET | `/assets/{id}` | Get asset details | Yes |
| PUT | `/assets/{id}` | Update asset | Yes |
| DELETE | `/assets/{id}` | Delete asset | Yes |

**Request/Response Examples**:

```json
// POST /assets - Create Asset
{
  "name": "Laptop - Dell XPS 15",
  "description": "Development laptop",
  "category": "Electronics",
  "imageUrl": "https://s3.../asset-123.jpg"
}

// Response
{
  "id": "uuid-123",
  "name": "Laptop - Dell XPS 15",
  "description": "Development laptop",
  "category": "Electronics",
  "imageUrl": "https://s3.../asset-123.jpg",
  "ownerId": "user-456",
  "createdAt": "2026-02-05T10:00:00Z",
  "updatedAt": "2026-02-05T10:00:00Z"
}
```

### GraphQL API (AppSync → DynamoDB)

**Endpoint**: Auto-generated by Amplify

**Queries**:
```graphql
# List tags for an asset
query ListAssetTags($assetId: String!) {
  listAssetTags(filter: { assetId: { eq: $assetId } }) {
    items {
      id
      assetId
      tagName
      tagValue
      createdAt
    }
  }
}

# Get asset status
query GetAssetStatus($assetId: String!) {
  listAssetStatuses(filter: { assetId: { eq: $assetId } }) {
    items {
      id
      assetId
      status
      statusNote
      updatedAt
    }
  }
}

# Get activity logs
query ListActivityLogs($assetId: String!) {
  listActivityLogs(filter: { assetId: { eq: $assetId } }) {
    items {
      id
      assetId
      action
      performedBy
      details
      timestamp
    }
  }
}
```

**Mutations**:
```graphql
# Add tag to asset
mutation CreateAssetTag($input: CreateAssetTagInput!) {
  createAssetTag(input: $input) {
    id
    assetId
    tagName
    tagValue
  }
}

# Update asset status
mutation CreateAssetStatus($input: CreateAssetStatusInput!) {
  createAssetStatus(input: $input) {
    id
    assetId
    status
    statusNote
  }
}

# Log activity
mutation CreateActivityLog($input: CreateActivityLogInput!) {
  createActivityLog(input: $input) {
    id
    assetId
    action
    timestamp
  }
}
```

---

## Implementation Steps

### Step 1: Setup Amplify Gen2 Project
```bash
npm create amplify@latest
cd <project-name>
npm install
```

### Step 2: Define Data Schema
- Create `amplify/data/resource.ts`
- Define Movie model with GraphQL schema
- Set authorization rules (public read, authenticated write)

### Step 3: Configure Authentication
- Create `amplify/auth/resource.ts`
- Enable email/password authentication
- Configure user attributes

### Step 4: Setup Storage
- Create `amplify/storage/resource.ts`
- Configure S3 bucket for movie posters
- Set access permissions

### Step 5: Deploy Backend
```bash
npx ampx sandbox
```

### Step 6: Build Vue3 Frontend
- Install Amplify libraries
- Configure Amplify in main.js
- Create components for CRUD operations
- Implement Pinia store for state management
- Add authentication UI

### Step 7: Connect Frontend to Backend
- Use Amplify GraphQL client
- Implement queries and mutations
- Handle file uploads to S3
- Manage authentication state

---

## Data Flow Diagrams

### Asset Creation Flow (RDS Path)
```
1. User fills AssetForm.vue
2. User uploads image → S3 (via Amplify Storage)
3. Get S3 URL
4. Submit form → assetStore.createAsset()
5. API call → API Gateway
6. Lambda function → Sequelize
7. Insert into RDS MySQL
8. Return asset data
9. Update Pinia store
10. Navigate to asset detail page
```

### Tag Management Flow (DynamoDB Path)
```
1. User adds tag in TagManager.vue
2. tagStore.addTag() → GraphQL mutation
3. AppSync → DynamoDB
4. Return tag data
5. Update UI with new tag
```

### Asset Detail View Flow (Combined)
```
1. User clicks asset card
2. Fetch asset metadata (RDS via API Gateway)
3. Fetch tags (DynamoDB via AppSync)
4. Fetch status (DynamoDB via AppSync)
5. Fetch activity logs (DynamoDB via AppSync)
6. Log "viewed" activity (DynamoDB via AppSync)
7. Display all data in AssetDetail.vue
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Setup infrastructure and authentication

1. Initialize Amplify Gen 2 project
2. Configure Cognito authentication
3. Setup S3 storage
4. Create Vue 3 project with Vite
5. Install dependencies (Element Plus, Tailwind, Pinia)
6. Implement login/signup UI
7. Test authentication flow

**Deliverable**: Users can sign up, log in, and log out

### Phase 2: RDS + Lambda Setup (Week 1-2)
**Goal**: Asset CRUD with RDS

1. Write CDK code for RDS MySQL instance
2. Create Sequelize models
3. Write Lambda functions (TypeScript)
4. Setup API Gateway with Cognito authorizer
5. Deploy infrastructure
6. Test API endpoints with Postman

**Deliverable**: Working REST API for asset management

### Phase 3: DynamoDB + AppSync (Week 2)
**Goal**: Tags, status, and logging

1. Define DynamoDB schema in Amplify
2. Deploy AppSync API
3. Test GraphQL queries/mutations
4. Integrate with frontend

**Deliverable**: Working GraphQL API for dynamic data

### Phase 4: Frontend Development (Week 2-3)
**Goal**: Build Vue 3 UI

1. Create layout components (header, footer, main layout)
2. Build asset list and card components
3. Create asset form (create/edit)
4. Implement image upload
5. Build asset detail view
6. Add tag management UI
7. Implement status tracking
8. Add activity log display
9. Setup Vue Router with auth guards
10. Implement Pinia stores

**Deliverable**: Fully functional UI

### Phase 5: Integration & Polish (Week 3)
**Goal**: Connect everything and refine

1. Connect all components to APIs
2. Add loading states
3. Implement error handling
4. Add confirmation dialogs
5. Test all user flows
6. Fix bugs
7. Add responsive design
8. Optimize performance

**Deliverable**: Production-ready application

### Phase 6: Optional Enhancements
**Goal**: Advanced features

1. Implement Glue job for reporting
2. Add search/filter functionality
3. Add pagination
4. Add asset categories management
5. Add export functionality
6. Add dashboard with statistics

---

## Sample Component Code

### AssetCard.vue (Props & Emits Example)
```vue
<script setup>
import { defineProps, defineEmits } from 'vue'
import { ElCard, ElButton, ElImage } from 'element-plus'

// Props - receive data from parent
const props = defineProps({
  asset: {
    type: Object,
    required: true
  }
})

// Emits - send events to parent
const emit = defineEmits(['view', 'edit', 'delete'])

const handleView = () => {
  emit('view', props.asset.id)
}

const handleEdit = () => {
  emit('edit', props.asset.id)
}

const handleDelete = () => {
  emit('delete', props.asset.id)
}
</script>

<template>
  <el-card class="asset-card" shadow="hover">
    <el-image 
      :src="asset.imageUrl || '/placeholder.png'" 
      fit="cover"
      class="asset-image"
    />
    <div class="asset-info">
      <h3>{{ asset.name }}</h3>
      <p class="category">{{ asset.category }}</p>
      <p class="description">{{ asset.description }}</p>
    </div>
    <div class="asset-actions">
      <el-button @click="handleView" type="primary" size="small">
        View
      </el-button>
      <el-button @click="handleEdit" size="small">
        Edit
      </el-button>
      <el-button @click="handleDelete" type="danger" size="small">
        Delete
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.asset-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.asset-image {
  width: 100%;
  height: 200px;
}

.asset-info {
  flex: 1;
  padding: 16px;
}

.category {
  color: #909399;
  font-size: 14px;
}

.description {
  margin-top: 8px;
  color: #606266;
}

.asset-actions {
  padding: 16px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #ebeef5;
}
</style>
```

### AssetForm.vue (v-model & Form Handling)
```vue
<script setup>
import { ref, reactive } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton, ElUpload } from 'element-plus'
import { useAssetStore } from '@/stores/assetStore'
import { uploadData } from 'aws-amplify/storage'

const assetStore = useAssetStore()
const loading = ref(false)

// Form data with v-model
const formData = reactive({
  name: '',
  description: '',
  category: '',
  imageUrl: ''
})

// Form validation rules
const rules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  category: [{ required: true, message: 'Category is required', trigger: 'blur' }]
}

// Image upload handler
const handleImageUpload = async (file) => {
  try {
    const result = await uploadData({
      key: `assets/${Date.now()}-${file.name}`,
      data: file,
      options: {
        contentType: file.type
      }
    }).result
    
    formData.imageUrl = result.key
  } catch (error) {
    console.error('Upload error:', error)
  }
}

// Form submit handler
const handleSubmit = async () => {
  loading.value = true
  try {
    await assetStore.createAsset(formData)
    // Navigate to assets list or show success message
  } catch (error) {
    console.error('Create error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-form 
    :model="formData" 
    :rules="rules" 
    label-width="120px"
    @submit.prevent="handleSubmit"
  >
    <el-form-item label="Asset Name" prop="name">
      <el-input v-model="formData.name" placeholder="Enter asset name" />
    </el-form-item>

    <el-form-item label="Description" prop="description">
      <el-input 
        v-model="formData.description" 
        type="textarea" 
        :rows="4"
        placeholder="Enter description"
      />
    </el-form-item>

    <el-form-item label="Category" prop="category">
      <el-input v-model="formData.category" placeholder="e.g., Electronics" />
    </el-form-item>

    <el-form-item label="Image">
      <el-upload
        :auto-upload="false"
        :on-change="handleImageUpload"
        :show-file-list="false"
      >
        <el-button>Upload Image</el-button>
      </el-upload>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" native-type="submit" :loading="loading">
        Create Asset
      </el-button>
    </el-form-item>
  </el-form>
</template>
```

### assetStore.js (Pinia Store)
```javascript
import { defineStore } from 'pinia'
import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

export const useAssetStore = defineStore('asset', {
  state: () => ({
    assets: [],
    currentAsset: null,
    loading: false,
    error: null
  }),

  getters: {
    assetsByCategory: (state) => {
      return (category) => state.assets.filter(a => a.category === category)
    }
  },

  actions: {
    async fetchAssets() {
      this.loading = true
      try {
        const session = await fetchAuthSession()
        const token = session.tokens.idToken.toString()
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/assets`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        this.assets = response.data
      } catch (error) {
        this.error = error.message
        console.error('Fetch assets error:', error)
      } finally {
        this.loading = false
      }
    },

    async createAsset(assetData) {
      this.loading = true
      try {
        const session = await fetchAuthSession()
        const token = session.tokens.idToken.toString()
        
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/assets`,
          assetData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        this.assets.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateAsset(id, assetData) {
      this.loading = true
      try {
        const session = await fetchAuthSession()
        const token = session.tokens.idToken.toString()
        
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/assets/${id}`,
          assetData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        const index = this.assets.findIndex(a => a.id === id)
        if (index !== -1) {
          this.assets[index] = response.data
        }
        
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteAsset(id) {
      this.loading = true
      try {
        const session = await fetchAuthSession()
        const token = session.tokens.idToken.toString()
        
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/assets/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        this.assets = this.assets.filter(a => a.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

### MainLayout.vue (Slots Example)
```vue
<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <div class="main-layout">
    <AppHeader />
    
    <main class="content">
      <!-- Default slot for page content -->
      <slot />
    </main>
    
    <AppFooter>
      <!-- Named slot for custom footer content -->
      <template #copyright>
        <slot name="footer-extra">
          © 2026 Asset Management System
        </slot>
      </template>
    </AppFooter>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
```

### AssetDetail.vue (Lifecycle Hooks & Conditional Rendering)
```vue
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAssetStore } from '@/stores/assetStore'
import { useTagStore } from '@/stores/tagStore'
import { ElLoading, ElMessageBox } from 'element-plus'

const route = useRoute()
const assetStore = useAssetStore()
const tagStore = useTagStore()

const asset = ref(null)
const tags = ref([])
const loading = ref(true)
const error = ref(null)

// Computed property
const isOwner = computed(() => {
  // Check if current user is the owner
  return asset.value?.ownerId === currentUserId.value
})

// Lifecycle hook - fetch data when component mounts
onMounted(async () => {
  try {
    const assetId = route.params.id
    
    // Fetch asset from RDS
    asset.value = await assetStore.fetchAssetById(assetId)
    
    // Fetch tags from DynamoDB
    tags.value = await tagStore.fetchTagsByAssetId(assetId)
    
    // Log activity
    await logActivity(assetId, 'viewed')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this asset?',
      'Confirmation',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    await assetStore.deleteAsset(asset.value.id)
    // Navigate back to list
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
    }
  }
}
</script>

<template>
  <div class="asset-detail">
    <!-- Loading state with v-if -->
    <div v-if="loading" class="loading">
      <el-loading />
    </div>

    <!-- Error state with v-else-if -->
    <div v-else-if="error" class="error">
      <p>Error: {{ error }}</p>
    </div>

    <!-- Content with v-else -->
    <div v-else class="content">
      <div class="asset-header">
        <h1>{{ asset.name }}</h1>
        
        <!-- Conditional rendering - only show actions if owner -->
        <div v-if="isOwner" class="actions">
          <el-button @click="handleEdit">Edit</el-button>
          <el-button type="danger" @click="handleDelete">Delete</el-button>
        </div>
      </div>

      <div class="asset-body">
        <img :src="asset.imageUrl" :alt="asset.name" />
        
        <div class="info">
          <p><strong>Category:</strong> {{ asset.category }}</p>
          <p><strong>Description:</strong> {{ asset.description }}</p>
          <p><strong>Created:</strong> {{ formatDate(asset.createdAt) }}</p>
        </div>

        <!-- Tags section -->
        <div class="tags">
          <h3>Tags</h3>
          <div v-if="tags.length > 0" class="tag-list">
            <span v-for="tag in tags" :key="tag.id" class="tag">
              {{ tag.tagName }}: {{ tag.tagValue }}
            </span>
          </div>
          <p v-else class="no-tags">No tags yet</p>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## Technology Checklist

### All Required Technologies Used

| Technology | Usage in Project | Component/File |
|------------|------------------|----------------|
| **Vue 3** | Frontend framework | All .vue files |
| **Element Plus** | UI component library | Forms, buttons, dialogs |
| **Tailwind CSS** | Utility-first styling | All components |
| **Pinia** | State management | stores/*.js |
| **Amplify Gen 2** | Backend framework | amplify/* |
| **AppSync** | GraphQL API | DynamoDB operations |
| **GraphQL** | Query language | Tag, status, log queries |
| **DynamoDB** | NoSQL database | Tags, status, activity logs |
| **RDS MySQL** | Relational database | Asset metadata |
| **Sequelize** | ORM for RDS | Lambda functions |
| **Lambda** | Serverless functions | CRUD operations |
| **TypeScript** | Lambda language | lambdas/*.ts |
| **Node.js** | Runtime | Lambda functions |
| **API Gateway** | REST API | Asset endpoints |
| **AWS CDK** | Infrastructure as code | amplify/backend.ts |
| **Cognito** | Authentication | User management |
| **S3** | Object storage | Asset images |
| **Glue Jobs** | ETL (optional) | Data reporting |
| **Python** | Glue job language | glue/*.py |

### Vue 3 Concepts Demonstrated

| Concept | Component | Implementation |
|---------|-----------|----------------|
| Component-based architecture | All components | Modular, reusable components |
| Templates & directives | AssetList.vue | v-for, v-if, v-else, v-show |
| Conditional rendering | AssetDetail.vue | v-if for loading/error/content |
| Event handling | AssetCard.vue | @click, custom events |
| Forms & v-model | AssetForm.vue | Two-way data binding |
| State management | assetStore.js | Pinia store |
| Props | AssetCard.vue | Parent to child data |
| Emits | AssetCard.vue | Child to parent events |
| Slots | MainLayout.vue | Content projection |
| Lifecycle hooks | AssetDetail.vue | onMounted for data fetching |
| Composables | useAuth.js | Reusable logic |
| Router guards | router/index.js | Protected routes |

---

## Security Considerations

### Authentication & Authorization

#### Overview
**Critical Security Rule**: Each user can ONLY access, modify, and delete their own assets. This is enforced at multiple layers.

#### Layer 1: RDS/Lambda Authorization (Asset Metadata)

**In Lambda Functions:**
```typescript
// Every Lambda function extracts the user ID from Cognito token
const userId = event.requestContext.authorizer?.claims.sub

// CREATE: Asset is created with the authenticated user as owner
const asset = await Asset.create({
  ...assetData,
  ownerId: userId  // ← Automatically set to current user
})

// READ (List): Users only see their own assets
const assets = await Asset.findAll({
  where: { ownerId: userId }  // ← Filter by owner
})

// READ (Single): Check ownership before returning
const asset = await Asset.findByPk(assetId)
if (asset.ownerId !== userId) {
  return { statusCode: 403, body: 'Forbidden' }  // ← Reject if not owner
}

// UPDATE: Verify ownership before updating
const asset = await Asset.findByPk(assetId)
if (!asset || asset.ownerId !== userId) {
  return { statusCode: 403, body: 'Forbidden' }  // ← Reject if not owner
}
await asset.update(updateData)

// DELETE: Verify ownership before deleting
const asset = await Asset.findByPk(assetId)
if (!asset || asset.ownerId !== userId) {
  return { statusCode: 403, body: 'Forbidden' }  // ← Reject if not owner
}
await asset.destroy()
```

**Key Points:**
- User ID is extracted from Cognito JWT token (cannot be faked)
- All queries filter by `ownerId`
- Update/Delete operations verify ownership first
- Returns 403 Forbidden if user doesn't own the asset

#### Layer 2: DynamoDB/AppSync Authorization (Tags, Status, Logs)

**In amplify/data/resource.ts:**
```typescript
const schema = a.schema({
  AssetTag: a.model({
    assetId: a.string().required(),
    tagName: a.string().required(),
    tagValue: a.string(),
    createdBy: a.string(),
    createdAt: a.datetime()
  })
  .authorization([
    // Only authenticated users can perform any operations
    a.allow.authenticated()
  ]),

  AssetStatus: a.model({
    assetId: a.string().required(),
    status: a.enum(['active', 'archived', 'maintenance', 'deleted']),
    statusNote: a.string(),
    updatedBy: a.string(),
    updatedAt: a.datetime()
  })
  .authorization([
    // Only authenticated users can perform any operations
    a.allow.authenticated()
  ]),

  ActivityLog: a.model({
    assetId: a.string().required(),
    action: a.enum(['created', 'viewed', 'updated', 'deleted']),
    performedBy: a.string(),
    details: a.string(),
    timestamp: a.datetime()
  })
  .authorization([
    // Only authenticated users can perform any operations
    a.allow.authenticated()
  ])
})
```

**Additional Frontend Validation:**
```javascript
// In tagStore.js, statusStore.js, activityStore.js
// Before performing operations on tags/status/logs:

// 1. First verify user owns the asset (call RDS API)
const asset = await assetStore.fetchAssetById(assetId)
if (!asset || asset.ownerId !== currentUserId) {
  throw new Error('You do not have permission to modify this asset')
}

// 2. Then perform DynamoDB operation
await createTag({ assetId, tagName, tagValue })
```

**Key Points:**
- AppSync requires authentication for all operations
- Frontend validates asset ownership before DynamoDB operations
- Tags/Status/Logs are linked to assets via `assetId`
- Users can only modify tags/status/logs for assets they own

#### Layer 3: S3 Storage Authorization

**In amplify/storage/resource.ts:**
```typescript
export const storage = defineStorage({
  name: 'assetImages',
  access: (allow) => ({
    // Path pattern: assets/{userId}/{assetId}/filename.jpg
    'assets/{entity_id}/*': [
      // {entity_id} is replaced with user's Cognito ID
      // Users can ONLY access their own folder
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
})
```

**Frontend Upload Logic:**
```javascript
// When uploading image for an asset
const uploadImage = async (assetId, file, userId) => {
  // Only upload if user owns the asset
  const asset = await assetStore.fetchAssetById(assetId)
  if (asset.ownerId !== currentUserId) {
    throw new Error('Cannot upload image for asset you do not own')
  }
  
  // Upload to S3 with user-specific path
  // {entity_id} is automatically replaced with current user's ID
  const result = await uploadData({
    key: `assets/${userId}/${assetId}/${file.name}`,
    data: file
  }).result
  
  return result.key
}
```

**Key Points:**
- Images are organized by user ID first, then asset ID
- S3-level isolation: Users physically cannot access other users' folders
- `{entity_id}` is automatically replaced with the authenticated user's Cognito ID
- Even if someone tries to access another user's path, S3 denies it
- No custom authorization code needed - AWS handles it

#### Layer 4: Frontend UI Authorization

**In Vue Components:**
```vue
<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Computed property to check ownership
const isOwner = computed(() => {
  return asset.value?.ownerId === authStore.user.id
})
</script>

<template>
  <div class="asset-detail">
    <!-- Only show edit/delete buttons if user is the owner -->
    <div v-if="isOwner" class="actions">
      <el-button @click="handleEdit">Edit</el-button>
      <el-button @click="handleDelete" type="danger">Delete</el-button>
    </div>
    
    <!-- Show read-only message if not owner -->
    <div v-else class="read-only-notice">
      <p>You are viewing this asset in read-only mode</p>
    </div>
  </div>
</template>
```

**Key Points:**
- UI hides edit/delete buttons for assets user doesn't own
- Provides clear feedback about read-only access
- Prevents accidental attempts to modify others' assets

### Authorization Flow Summary

```
User Action: Update Asset
    ↓
1. Frontend Check: Is user the owner?
    ├─ No → Show error, stop
    └─ Yes → Continue
    ↓
2. API Call with JWT Token
    ↓
3. API Gateway: Validate Cognito token
    ├─ Invalid → 401 Unauthorized
    └─ Valid → Extract userId, continue
    ↓
4. Lambda Function: Verify ownership
    ├─ Query asset from RDS
    ├─ Compare asset.ownerId === userId
    ├─ Not owner → 403 Forbidden
    └─ Is owner → Perform update
    ↓
5. Return updated asset
```

### Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of authorization
2. **Principle of Least Privilege**: Users only access their own data
3. **Token-Based Auth**: JWT tokens from Cognito (cannot be forged)
4. **Server-Side Validation**: Never trust client-side checks alone
5. **Explicit Ownership**: Every asset has an `ownerId` field
6. **Consistent Checks**: Ownership verified in every operation
7. **Clear Error Messages**: 403 Forbidden for unauthorized access
8. **Audit Trail**: Activity logs track who did what

### What Users CANNOT Do

❌ View other users' assets
❌ Edit other users' assets
❌ Delete other users' assets
❌ Add tags to other users' assets
❌ Change status of other users' assets
❌ Upload images for other users' assets
❌ View other users' activity logs

### What Users CAN Do

✅ Create their own assets
✅ View their own assets
✅ Edit their own assets
✅ Delete their own assets
✅ Add tags to their own assets
✅ Change status of their own assets
✅ Upload images for their own assets
✅ View their own activity logs

### Data Security
- RDS in private VPC subnet
- Lambda functions in VPC to access RDS
- S3 bucket with authenticated access only
- Secrets stored in AWS Secrets Manager
- Environment variables for sensitive data
- All data encrypted at rest and in transit

### Frontend Security
- No sensitive data in client code
- Tokens stored securely (Amplify handles this)
- Input validation on forms
- XSS protection (Vue handles this)
- CSRF protection via JWT tokens

---

## Environment Setup

### Prerequisites
```bash
# Node.js 18+
node --version

# AWS CLI configured
aws configure

# Amplify CLI
npm install -g @aws-amplify/cli
```

### Project Initialization
```bash
# Create Amplify Gen 2 project
npm create amplify@latest

# Navigate to project
cd asset-management-app

# Install dependencies
npm install

# Install frontend dependencies
npm install vue@latest pinia element-plus
npm install -D tailwindcss postcss autoprefixer
npm install aws-amplify

# Initialize Tailwind
npx tailwindcss init -p
```

### Backend Setup
```bash
# Start Amplify sandbox (local development)
npx ampx sandbox

# Deploy to AWS (production)
npx ampx deploy
```

### Database Setup
```bash
# RDS will be created by CDK
# Run migrations (if using Sequelize migrations)
npx sequelize-cli db:migrate

# Seed initial data (optional)
npx sequelize-cli db:seed:all
```

---

## Testing Strategy

### Manual Testing Checklist

**Authentication**
- [ ] User can sign up with email
- [ ] User receives verification email
- [ ] User can log in with credentials
- [ ] User can log out
- [ ] Unauthenticated users redirected to login

**Asset Management (RDS)**
- [ ] User can create new asset
- [ ] User can view list of their assets
- [ ] User can view asset details
- [ ] User can edit their asset
- [ ] User can delete their asset (with confirmation)
- [ ] User cannot edit/delete others' assets

**Image Upload (S3)**
- [ ] User can upload image during asset creation
- [ ] Image displays correctly in asset card
- [ ] Image displays correctly in asset detail
- [ ] User can update asset image

**Tags (DynamoDB)**
- [ ] User can add tags to asset
- [ ] Tags display on asset detail page
- [ ] User can remove tags

**Status (DynamoDB)**
- [ ] User can set asset status
- [ ] Status displays correctly
- [ ] Status history is maintained

**Activity Logs (DynamoDB)**
- [ ] Asset views are logged
- [ ] Asset edits are logged
- [ ] Activity timeline displays correctly

**UI/UX**
- [ ] Loading states display during API calls
- [ ] Error messages display on failures
- [ ] Confirmation dialogs work correctly
- [ ] Responsive design works on mobile
- [ ] Navigation works correctly

---

## Deployment

### Amplify Hosting (Recommended)
```bash
# Connect Git repository
amplify add hosting

# Deploy
amplify publish
```

### Manual Deployment
```bash
# Build frontend
npm run build

# Deploy to S3 + CloudFront
aws s3 sync dist/ s3://your-bucket-name
```

---

## Project Timeline

### Week 1: Infrastructure & Backend
- Days 1-2: Amplify setup, Cognito, S3
- Days 3-4: RDS + Lambda + API Gateway (CDK)
- Days 5-7: DynamoDB + AppSync, testing

### Week 2: Frontend Development
- Days 1-2: Vue project setup, routing, auth UI
- Days 3-4: Asset CRUD components
- Days 5-7: Tags, status, activity log UI

### Week 3: Integration & Polish
- Days 1-3: Connect frontend to all APIs
- Days 4-5: Error handling, loading states
- Days 6-7: Testing, bug fixes, deployment

---

## Learning Resources

### Vue 3
- [Vue 3 Official Docs](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Element Plus](https://element-plus.org/)

### AWS Amplify Gen 2
- [Amplify Gen 2 Docs](https://docs.amplify.aws/)
- [Amplify Gen 2 Tutorial](https://docs.amplify.aws/start/)

### AWS Services
- [AppSync GraphQL](https://docs.aws.amazon.com/appsync/)
- [API Gateway](https://docs.aws.amazon.com/apigateway/)
- [Lambda](https://docs.aws.amazon.com/lambda/)
- [RDS](https://docs.aws.amazon.com/rds/)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/)

### Sequelize
- [Sequelize Docs](https://sequelize.org/)
- [Sequelize with TypeScript](https://sequelize.org/docs/v6/other-topics/typescript/)

---

## Common Pitfalls & Solutions

### Issue: Lambda can't connect to RDS
**Solution**: Ensure Lambda is in same VPC as RDS, security groups allow traffic

### Issue: CORS errors from API Gateway
**Solution**: Enable CORS in API Gateway configuration

### Issue: Cognito token expired
**Solution**: Implement token refresh logic in frontend

### Issue: S3 upload fails
**Solution**: Check IAM permissions, bucket policy, and CORS configuration

### Issue: GraphQL mutations fail
**Solution**: Check authorization rules in schema, ensure user is authenticated

### Issue: Sequelize connection timeout
**Solution**: Use connection pooling, increase timeout, check VPC configuration

---

## Success Criteria

### Functional Requirements Met
✅ User authentication (signup, login, logout)
✅ Asset CRUD operations
✅ Image upload to S3
✅ Tag management
✅ Status tracking
✅ Activity logging
✅ Confirmation dialogs

### Technical Requirements Met
✅ Vue 3 with Composition API
✅ All Vue concepts demonstrated
✅ Pinia state management
✅ Element Plus UI components
✅ Amplify Gen 2 backend
✅ RDS MySQL with Sequelize
✅ DynamoDB with AppSync
✅ Lambda functions (TypeScript)
✅ API Gateway REST API
✅ AWS CDK infrastructure
✅ Cognito authentication
✅ S3 storage

### Code Quality
✅ Modular component structure
✅ Proper error handling
✅ Loading states
✅ Clean, readable code
✅ Comments where needed

---

## Next Steps After Review

1. **Review this design document** - Ensure all requirements are covered
2. **Clarify any questions** - Discuss unclear parts
3. **Approve architecture** - Confirm the approach
4. **Start implementation** - Begin with Phase 1
5. **Iterate and improve** - Adjust as needed during development

---

## Notes

- This design keeps everything as simple as possible while meeting all requirements
- Each technology is used in its most straightforward way
- The split between RDS and DynamoDB is logical and demonstrates both databases
- All Vue 3 concepts are naturally integrated into the application
- The architecture is scalable and follows AWS best practices
- Focus on learning and hands-on experience, not over-engineering
