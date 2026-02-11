# Asset Management Application - Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        VUE[Vue 3 SPA<br/>Composition API + Pinia<br/>Element Plus + Tailwind]
    end

    subgraph "Authentication & Authorization"
        COGNITO[Amazon Cognito<br/>User Pool]
    end

    subgraph "API Layer"
        APPSYNC[AWS AppSync<br/>GraphQL API]
        APIGW[API Gateway<br/>REST API]
    end

    subgraph "Compute Layer"
        LAMBDA1[Lambda: createAsset]
        LAMBDA2[Lambda: listAssets]
        LAMBDA3[Lambda: getAsset]
        LAMBDA4[Lambda: updateAsset]
        LAMBDA5[Lambda: deleteAsset]
        LAMBDA6[Lambda: syncSchema]
    end

    subgraph "Data Layer"
        RDS[(RDS MySQL<br/>Asset Metadata<br/>Sequelize ORM)]
        DYNAMO[(DynamoDB<br/>Tags, Status,<br/>Activity Logs)]
    end

    subgraph "Storage Layer"
        S3[S3 Bucket<br/>Asset Images]
    end

    subgraph "Infrastructure"
        VPC[VPC<br/>Private Subnets]
        SECRETS[Secrets Manager<br/>DB Credentials]
    end

    %% Frontend connections
    VUE -->|Authentication| COGNITO
    VUE -->|GraphQL Queries/Mutations| APPSYNC
    VUE -->|REST API Calls| APIGW
    VUE -->|Upload/Download Images| S3

    %% API Gateway to Lambda
    APIGW -->|Invoke| LAMBDA1
    APIGW -->|Invoke| LAMBDA2
    APIGW -->|Invoke| LAMBDA3
    APIGW -->|Invoke| LAMBDA4
    APIGW -->|Invoke| LAMBDA5
    APIGW -->|Invoke| LAMBDA6

    %% AppSync to DynamoDB
    APPSYNC -->|CRUD Operations| DYNAMO

    %% Lambda to RDS
    LAMBDA1 -->|Insert| RDS
    LAMBDA2 -->|Query| RDS
    LAMBDA3 -->|Query| RDS
    LAMBDA4 -->|Update| RDS
    LAMBDA5 -->|Delete| RDS
    LAMBDA6 -->|Schema Sync| RDS

    %% Infrastructure connections
    LAMBDA1 -.->|Inside| VPC
    LAMBDA2 -.->|Inside| VPC
    LAMBDA3 -.->|Inside| VPC
    LAMBDA4 -.->|Inside| VPC
    LAMBDA5 -.->|Inside| VPC
    LAMBDA6 -.->|Inside| VPC
    RDS -.->|Inside| VPC
    LAMBDA1 -.->|Fetch Credentials| SECRETS
    LAMBDA2 -.->|Fetch Credentials| SECRETS
    LAMBDA3 -.->|Fetch Credentials| SECRETS
    LAMBDA4 -.->|Fetch Credentials| SECRETS
    LAMBDA5 -.->|Fetch Credentials| SECRETS
    LAMBDA6 -.->|Fetch Credentials| SECRETS

    %% Cognito authorization
    COGNITO -.->|Authorize| APIGW
    COGNITO -.->|Authorize| APPSYNC

    style VUE fill:#42b883,stroke:#35495e,stroke-width:3px,color:#fff
    style COGNITO fill:#ff9900,stroke:#232f3e,stroke-width:2px,color:#fff
    style APPSYNC fill:#945eb8,stroke:#232f3e,stroke-width:2px,color:#fff
    style APIGW fill:#ff4f8b,stroke:#232f3e,stroke-width:2px,color:#fff
    style RDS fill:#527fff,stroke:#232f3e,stroke-width:2px,color:#fff
    style DYNAMO fill:#4053d6,stroke:#232f3e,stroke-width:2px,color:#fff
    style S3 fill:#569a31,stroke:#232f3e,stroke-width:2px,color:#fff
    style VPC fill:#f0f0f0,stroke:#232f3e,stroke-width:2px
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Vue3
    participant Cognito
    participant APIGateway
    participant Lambda
    participant RDS
    participant AppSync
    participant DynamoDB
    participant S3

    Note over User,S3: Asset Creation Flow

    User->>Vue3: Fill Asset Form
    User->>Vue3: Upload Image
    Vue3->>Cognito: Authenticate
    Cognito-->>Vue3: JWT Token
    Vue3->>S3: Upload Image
    S3-->>Vue3: Image URL
    Vue3->>APIGateway: POST /assets (with token)
    APIGateway->>Cognito: Validate Token
    Cognito-->>APIGateway: Token Valid
    APIGateway->>Lambda: Invoke createAsset
    Lambda->>RDS: INSERT Asset
    RDS-->>Lambda: Asset Created
    Lambda-->>APIGateway: Response
    APIGateway-->>Vue3: Asset Data
    Vue3->>AppSync: Create ActivityLog (GraphQL)
    AppSync->>DynamoDB: INSERT Log
    DynamoDB-->>AppSync: Log Created
    AppSync-->>Vue3: Success
    Vue3-->>User: Show Success Message

    Note over User,S3: Asset Detail View Flow

    User->>Vue3: Click Asset Card
    Vue3->>APIGateway: GET /assets/{id}
    APIGateway->>Lambda: Invoke getAsset
    Lambda->>RDS: SELECT Asset
    RDS-->>Lambda: Asset Data
    Lambda-->>Vue3: Asset Metadata
    Vue3->>AppSync: Query Tags
    AppSync->>DynamoDB: Query AssetTags
    DynamoDB-->>Vue3: Tags Data
    Vue3->>AppSync: Query Status
    AppSync->>DynamoDB: Query AssetStatus
    DynamoDB-->>Vue3: Status Data
    Vue3->>AppSync: Query Activity Logs
    AppSync->>DynamoDB: Query ActivityLog
    DynamoDB-->>Vue3: Logs Data
    Vue3->>S3: Fetch Image
    S3-->>Vue3: Image Data
    Vue3-->>User: Display Complete Asset View
```

## Component Architecture

```mermaid
graph LR
    subgraph "Vue 3 Frontend Architecture"
        subgraph "Views"
            HOME[HomeView]
            ASSETS[AssetsView]
            DETAIL[AssetDetailView]
            CREATE[CreateAssetView]
        end

        subgraph "Components"
            HEADER[AppHeader]
            CARD[AssetCard]
            FORM[AssetForm]
            TAGS[TagManager]
            UPLOAD[ImageUpload]
        end

        subgraph "State Management"
            AUTHSTORE[authStore<br/>Pinia]
            ASSETSTORE[assetStore<br/>Pinia]
            TAGSTORE[tagStore<br/>Pinia]
        end

        subgraph "Services"
            APISERVICE[apiService.js<br/>REST Calls]
            GQLSERVICE[graphqlService.js<br/>GraphQL Calls]
            STORAGESERVICE[storageService.js<br/>S3 Operations]
        end

        subgraph "Composables"
            USEAUTH[useAuth]
            USEASSETS[useAssets]
            USEUPLOAD[useImageUpload]
        end
    end

    ASSETS --> CARD
    DETAIL --> TAGS
    CREATE --> FORM
    CREATE --> UPLOAD

    CARD --> ASSETSTORE
    FORM --> ASSETSTORE
    TAGS --> TAGSTORE
    HEADER --> AUTHSTORE

    ASSETSTORE --> APISERVICE
    TAGSTORE --> GQLSERVICE
    AUTHSTORE --> APISERVICE
    AUTHSTORE --> GQLSERVICE

    UPLOAD --> STORAGESERVICE

    USEAUTH --> AUTHSTORE
    USEASSETS --> ASSETSTORE
    USEUPLOAD --> STORAGESERVICE

    style HOME fill:#e3f2fd
    style ASSETS fill:#e3f2fd
    style DETAIL fill:#e3f2fd
    style CREATE fill:#e3f2fd
    style AUTHSTORE fill:#fff3e0
    style ASSETSTORE fill:#fff3e0
    style TAGSTORE fill:#fff3e0
```

## Database Schema Design

```mermaid
erDiagram
    ASSETS ||--o{ ASSET_TAGS : has
    ASSETS ||--o{ ASSET_STATUS : has
    ASSETS ||--o{ ACTIVITY_LOGS : has
    USERS ||--o{ ASSETS : owns

    ASSETS {
        uuid id PK
        string name
        text description
        string category
        string imageUrl
        string ownerId FK
        timestamp createdAt
        timestamp updatedAt
    }

    ASSET_TAGS {
        uuid id PK
        string assetId FK
        string tagName
        string tagValue
        string createdBy
        timestamp createdAt
    }

    ASSET_STATUS {
        uuid id PK
        string assetId FK
        enum status
        string statusNote
        string updatedBy
        timestamp updatedAt
    }

    ACTIVITY_LOGS {
        uuid id PK
        string assetId FK
        enum action
        string performedBy
        string details
        timestamp timestamp
    }

    USERS {
        string id PK
        string email
        string name
    }
```

## AWS Infrastructure Diagram

```mermaid
graph TB
    subgraph "AWS Cloud"
        subgraph "Region: us-east-1"
            subgraph "VPC"
                subgraph "Public Subnet"
                    NAT[NAT Gateway]
                end
                
                subgraph "Private Subnet AZ-1"
                    LAMBDA_GROUP[Lambda Functions<br/>6 Functions]
                    RDS_PRIMARY[(RDS MySQL<br/>Primary Instance)]
                end
                
                subgraph "Private Subnet AZ-2"
                    RDS_STANDBY[(RDS MySQL<br/>Standby)]
                end
                
                VPC_ENDPOINT[VPC Endpoints<br/>Secrets Manager]
            end
            
            COGNITO_POOL[Cognito User Pool]
            APPSYNC_API[AppSync API]
            API_GW[API Gateway]
            DYNAMO_TABLE[(DynamoDB Tables<br/>AssetTags<br/>AssetStatus<br/>ActivityLogs)]
            S3_BUCKET[S3 Bucket<br/>Asset Images]
            SECRETS_MGR[Secrets Manager<br/>DB Credentials]
            CLOUDWATCH[CloudWatch Logs]
        end
    end

    subgraph "Client"
        BROWSER[Web Browser<br/>Vue 3 App]
    end

    BROWSER -->|HTTPS| COGNITO_POOL
    BROWSER -->|HTTPS| APPSYNC_API
    BROWSER -->|HTTPS| API_GW
    BROWSER -->|HTTPS| S3_BUCKET

    API_GW --> LAMBDA_GROUP
    LAMBDA_GROUP --> RDS_PRIMARY
    RDS_PRIMARY -.->|Replication| RDS_STANDBY
    LAMBDA_GROUP --> VPC_ENDPOINT
    VPC_ENDPOINT --> SECRETS_MGR
    APPSYNC_API --> DYNAMO_TABLE
    LAMBDA_GROUP --> CLOUDWATCH
    API_GW --> CLOUDWATCH

    style BROWSER fill:#42b883,stroke:#35495e,stroke-width:3px,color:#fff
    style COGNITO_POOL fill:#ff9900,stroke:#232f3e,stroke-width:2px,color:#fff
    style APPSYNC_API fill:#945eb8,stroke:#232f3e,stroke-width:2px,color:#fff
    style API_GW fill:#ff4f8b,stroke:#232f3e,stroke-width:2px,color:#fff
    style LAMBDA_GROUP fill:#ff9900,stroke:#232f3e,stroke-width:2px,color:#fff
    style RDS_PRIMARY fill:#527fff,stroke:#232f3e,stroke-width:2px,color:#fff
    style RDS_STANDBY fill:#527fff,stroke:#232f3e,stroke-width:2px,color:#fff
    style DYNAMO_TABLE fill:#4053d6,stroke:#232f3e,stroke-width:2px,color:#fff
    style S3_BUCKET fill:#569a31,stroke:#232f3e,stroke-width:2px,color:#fff
```

## Technology Stack Summary

```mermaid
mindmap
  root((Asset Management<br/>Application))
    Frontend
      Vue 3
        Composition API
        Script Setup
      UI Libraries
        Element Plus
        Tailwind CSS
      State Management
        Pinia
      Routing
        Vue Router
    Backend
      AWS Amplify Gen2
        defineBackend
        defineAuth
        defineData
        defineStorage
      AWS CDK
        Infrastructure as Code
        TypeScript
    APIs
      REST API
        API Gateway
        Lambda Functions
        Node.js 20.x
      GraphQL API
        AWS AppSync
        Auto-generated
    Databases
      RDS MySQL
        Sequelize ORM
        Asset Metadata
      DynamoDB
        Tags
        Status
        Activity Logs
    Storage
      Amazon S3
        Asset Images
        User Isolation
    Security
      Amazon Cognito
        User Pools
        JWT Tokens
      VPC
        Private Subnets
        Security Groups
      Secrets Manager
        DB Credentials
```

## Key Features Implemented

```mermaid
graph LR
    subgraph "Core Features"
        AUTH[Authentication<br/>Sign Up/Login]
        CRUD[Asset CRUD<br/>Create/Read/Update/Delete]
        UPLOAD[Image Upload<br/>S3 Storage]
        TAGS[Tag Management<br/>Flexible Tagging]
        STATUS[Status Tracking<br/>Lifecycle Management]
        LOGS[Activity Logging<br/>Audit Trail]
    end

    subgraph "Vue 3 Concepts"
        REACTIVE[Reactive State<br/>ref, reactive]
        COMPUTED[Computed Properties<br/>Getters]
        LIFECYCLE[Lifecycle Hooks<br/>onMounted]
        PROPS[Props & Emits<br/>Component Communication]
        SLOTS[Slots<br/>Content Distribution]
        COMPOSABLES[Composables<br/>Reusable Logic]
        PINIA[Pinia Stores<br/>State Management]
        ROUTER[Vue Router<br/>Navigation Guards]
    end

    AUTH --> REACTIVE
    CRUD --> PINIA
    UPLOAD --> COMPOSABLES
    TAGS --> PROPS
    STATUS --> COMPUTED
    LOGS --> LIFECYCLE

    style AUTH fill:#4caf50,color:#fff
    style CRUD fill:#2196f3,color:#fff
    style UPLOAD fill:#ff9800,color:#fff
    style TAGS fill:#9c27b0,color:#fff
    style STATUS fill:#f44336,color:#fff
    style LOGS fill:#00bcd4,color:#fff
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV_LOCAL[Local Development<br/>npx ampx sandbox]
        DEV_FRONTEND[Vite Dev Server<br/>npm run dev]
    end

    subgraph "CI/CD Pipeline"
        GIT[Git Repository<br/>GitHub/GitLab]
        BUILD[Build Process<br/>npm run build]
        DEPLOY[Amplify Deploy<br/>npx ampx pipeline-deploy]
    end

    subgraph "Production"
        AMPLIFY_HOSTING[Amplify Hosting<br/>CDN Distribution]
        BACKEND_STACK[Backend Stack<br/>CloudFormation]
    end

    DEV_LOCAL --> GIT
    DEV_FRONTEND --> GIT
    GIT --> BUILD
    BUILD --> DEPLOY
    DEPLOY --> AMPLIFY_HOSTING
    DEPLOY --> BACKEND_STACK

    style DEV_LOCAL fill:#e8f5e9
    style DEV_FRONTEND fill:#e8f5e9
    style AMPLIFY_HOSTING fill:#c8e6c9
    style BACKEND_STACK fill:#c8e6c9
```

---

## Architecture Highlights

### 1. Dual Database Strategy
- **RDS MySQL**: Structured asset metadata requiring ACID compliance
- **DynamoDB**: Flexible, fast-access data (tags, status, logs)
- Demonstrates optimal use case for each database type

### 2. Dual API Approach
- **REST API (API Gateway + Lambda)**: Traditional CRUD operations on RDS
- **GraphQL API (AppSync)**: Real-time queries on DynamoDB
- Shows proficiency with both API paradigms

### 3. Security Best Practices
- VPC isolation for Lambda and RDS
- Secrets Manager for credential management
- Cognito JWT authentication
- S3 user-level access control
- Private subnets with VPC endpoints

### 4. Vue 3 Modern Patterns
- Composition API with `<script setup>`
- Pinia for state management
- Composables for reusable logic
- Props/Emits for component communication
- Slots for flexible layouts

### 5. Infrastructure as Code
- AWS CDK for complete infrastructure definition
- Amplify Gen 2 for simplified backend setup
- Version-controlled infrastructure
- Reproducible deployments

### 6. Scalability & Performance
- Lambda auto-scaling
- DynamoDB on-demand capacity
- S3 CDN distribution
- API Gateway caching (optional)
- Connection pooling in Lambda

---

## Cost Optimization

- **RDS**: T3.micro instance (Free Tier eligible)
- **Lambda**: Pay-per-invocation (Free Tier: 1M requests/month)
- **DynamoDB**: On-demand pricing (Free Tier: 25GB storage)
- **S3**: Standard storage (Free Tier: 5GB)
- **Cognito**: Free Tier: 50,000 MAUs
- **API Gateway**: Free Tier: 1M API calls/month

**Estimated Monthly Cost**: $10-30 for moderate usage beyond free tier
