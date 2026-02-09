# Step 1.3.0: Setup TypeScript for Lambda Functions

## 🎯 Goal
Set up TypeScript infrastructure for Lambda functions before creating models and database helpers.

## 📚 What You'll Learn
- TypeScript configuration for Node.js/Lambda
- Type definitions for AWS Lambda
- Build process with TypeScript
- Type-safe development workflow
- ESBuild for fast compilation

## 📋 Prerequisites
- [ ] Step 1.2.x completed (Authentication UI done)
- [ ] Node.js and npm installed
- [ ] Understanding of TypeScript basics

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the project root directory:

```bash
cd asset-management-app
pwd
```

Expected: `.../asset-management-app`

---

### 2. Create Lambda Folder Structure

```bash
mkdir -p lambdas/shared/src/{config,models,types,utils}
mkdir -p lambdas/shared/scripts
```

Verify the structure:

```bash
ls -la lambdas/shared/
```

You should see `src` and `scripts` directories.

---

### 3. Initialize Package.json

```bash
cd lambdas/shared
npm init -y
```

---

### 4. Install TypeScript Dependencies

Install TypeScript and related tools:

```bash
npm install --save-dev typescript @types/node tsx esbuild
```

Install runtime dependencies:

```bash
npm install sequelize mysql2 dotenv
npm install @aws-sdk/client-secrets-manager
```

Install type definitions:

```bash
npm install --save-dev @types/aws-lambda
```

---

### 5. Create TypeScript Configuration

Create `tsconfig.json`:

```bash
touch tsconfig.json
```

Open `lambdas/shared/tsconfig.json` and add:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Save the file!**

---

### 6. Update package.json Scripts

Open `lambdas/shared/package.json` and update:

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
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "@types/aws-lambda": "^8.10.145",
    "tsx": "^4.19.2",
    "esbuild": "^0.24.2"
  }
}
```

**Save the file!**

---

### 7. Create Type Definitions

Create type definitions for our application:

```bash
touch src/types/index.ts
```

Open `lambdas/shared/src/types/index.ts` and add:

```typescript
/**
 * Shared type definitions for Asset Management App
 */

import { Model, Optional } from 'sequelize'

// Asset category enum
export enum AssetCategory {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  OTHER = 'other',
}

// Asset attributes interface
export interface AssetAttributes {
  id: string
  ownerId: string
  name: string
  description: string | null
  category: AssetCategory
  imageKey: string | null
  createdAt: Date
  updatedAt: Date
}

// Asset creation attributes (fields that are optional during creation)
export interface AssetCreationAttributes
  extends Optional<AssetAttributes, 'id' | 'description' | 'imageKey' | 'createdAt' | 'updatedAt'> {}

// Asset instance type (Sequelize Model instance)
export interface AssetInstance
  extends Model<AssetAttributes, AssetCreationAttributes>,
    AssetAttributes {}

// Database configuration
export interface DatabaseConfig {
  dialect: 'mysql'
  host: string
  port: number
  database: string
  username: string
  password: string
  logging: boolean | ((sql: string) => void)
  pool: {
    max: number
    min: number
    acquire: number
    idle: number
  }
  dialectOptions?: {
    connectTimeout: number
  }
}

// Secrets Manager types
export interface DatabaseSecret {
  host: string
  port?: number
  dbname?: string
  database?: string
  username: string
  password: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Lambda event types
export interface AssetEvent {
  ownerId: string
  name: string
  description?: string
  category: AssetCategory
  imageKey?: string
}

export interface AssetUpdateEvent extends Partial<AssetEvent> {
  id: string
}
```

**Save the file!**

---

### 8. Create Environment Variables Type

Create a type-safe environment configuration:

```bash
touch src/config/env.ts
```

Open `lambdas/shared/src/config/env.ts` and add:

```typescript
import dotenv from 'dotenv'
import path from 'path'

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
    console.log('📁 Loading .env from:', envPath)
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
```

**Save the file!**

---

### 9. Create .env File

```bash
touch .env
touch .env.example
```

Open `lambdas/shared/.env.example` and add:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=heratraining
DB_USER=root
DB_PASSWORD=your_password_here

# AWS Configuration
AWS_REGION=us-east-1
DB_SECRET_NAME=

# Environment
NODE_ENV=development

# Database Pool Configuration
DB_POOL_MAX=5
DB_POOL_MIN=0
```

**Save the file!**

Copy to create your actual `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your actual MySQL password.

---

### 10. Create .gitignore

```bash
touch .gitignore
```

Open `lambdas/shared/.gitignore` and add:

```
# Dependencies
node_modules/

# Build output
dist/
*.js
*.js.map
*.d.ts
*.d.ts.map

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Keep example files
!.env.example
```

**Save the file!**

---

### 11. Test TypeScript Setup

Create a simple test file:

```bash
touch src/index.ts
```

Open `lambdas/shared/src/index.ts` and add:

```typescript
import { env, validateEnv } from './config/env'
import type { AssetAttributes, AssetCategory } from './types'

console.log('🚀 TypeScript setup test')
console.log('Environment:', env.NODE_ENV)
console.log('Database:', env.DB_NAME)

// Test type checking
const testAsset: AssetAttributes = {
  id: '123',
  ownerId: 'user-123',
  name: 'Test Asset',
  description: 'A test asset description',
  category: 'image' as AssetCategory,
  imageKey: 'test/image.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
}

console.log('✅ TypeScript is working!')
console.log('Test asset:', testAsset)

// Validate environment
try {
  validateEnv()
  console.log('✅ Environment variables validated')
} catch (error) {
  console.error('❌ Environment validation failed:', error)
}
```

**Save the file!**

Run the test:

```bash
npm run dev
```

**Expected output:**
```
🚀 TypeScript setup test
Environment: development
Database: heratraining
✅ TypeScript is working!
Test asset: {
  id: '123',
  ownerId: 'user-123',
  name: 'Test Asset',
  description: 'A test asset description',
  category: 'image',
  imageKey: 'test/image.jpg',
  createdAt: 2024-...,
  updatedAt: 2024-...
}
✅ Environment variables validated
```

---

### 12. Build TypeScript

Test the build process:

```bash
npm run build
```

Check the output:

```bash
ls -la dist/
```

You should see compiled JavaScript files and type definitions.

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `lambdas/shared` folder structure created
- [ ] TypeScript and dependencies installed
- [ ] `tsconfig.json` created and configured
- [ ] `package.json` updated with scripts
- [ ] Type definitions created in `src/types/index.ts`
- [ ] Environment configuration created in `src/config/env.ts`
- [ ] `.env` file created with database credentials
- [ ] `.gitignore` created
- [ ] Test file runs successfully with `npm run dev`
- [ ] Build succeeds with `npm run build`
- [ ] `dist/` folder contains compiled files

---

## 🔍 Understanding What You Built

### File Structure
```
lambdas/shared/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment configuration
│   ├── models/                 # (Will add in next step)
│   ├── types/
│   │   └── index.ts            # Type definitions
│   ├── utils/                  # (Will add later)
│   └── index.ts                # Entry point
├── scripts/                    # Utility scripts
├── dist/                       # Compiled output (gitignored)
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

### TypeScript Benefits

**Type Safety**:
```typescript
// Compile-time error if wrong type
const asset: AssetAttributes = {
  id: 123,  // ❌ Error: Type 'number' is not assignable to type 'string'
  // ...
}
```

**IntelliSense**:
- Auto-completion in VS Code
- Inline documentation
- Refactoring support

**Catch Errors Early**:
```typescript
// Before runtime
function createAsset(data: AssetCreationAttributes) {
  // TypeScript ensures all required fields are present
}
```

---

## 🎓 Key Concepts

### 1. TypeScript Configuration

**target**: JavaScript version to compile to
```json
"target": "ES2022"  // Modern JavaScript
```

**module**: Module system
```json
"module": "commonjs"  // For Node.js/Lambda
```

**strict**: Enable all strict type checking
```json
"strict": true  // Catch more errors
```

### 2. Type Definitions

**Interfaces** for object shapes:
```typescript
interface AssetAttributes {
  id: string
  name: string
}
```

**Enums** for constants:
```typescript
enum AssetCategory {
  IMAGE = 'image',
  DOCUMENT = 'document'
}
```

**Type aliases** for unions:
```typescript
type Environment = 'development' | 'production' | 'test'
```

### 3. Build Process

**Development** (tsx):
```bash
npm run dev  # Run TypeScript directly, no build needed
```

**Production** (tsc):
```bash
npm run build  # Compile to JavaScript
node dist/index.js  # Run compiled code
```

### 4. Path Aliases

Configure in `tsconfig.json`:
```json
"paths": {
  "@/*": ["src/*"]
}
```

Use in code:
```typescript
import { Asset } from '@/models/Asset'  // Instead of '../models/Asset'
```

---

## 📝 Notes

- TypeScript provides type safety at compile time
- `tsx` allows running TypeScript directly (development)
- `tsc` compiles TypeScript to JavaScript (production)
- Type definitions help catch errors before runtime
- Environment variables are now type-safe
- All Lambda functions will use this shared TypeScript code

---

## 🎯 What's Next?

In the next step (1.3.1), we'll:
- Design the RDS database schema (already done, but we'll review)
- Then in 1.3.2, we'll create Sequelize models in TypeScript
- Add proper type definitions for models
- Create type-safe database operations

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.0! 🎉

**You now have:**
- ✅ TypeScript configured for Lambda functions
- ✅ Type definitions for the application
- ✅ Type-safe environment configuration
- ✅ Build process set up
- ✅ Development workflow ready
- ✅ Ready to create TypeScript models!

---

**Ready for Step 1.3.1 (Schema Design Review)?** Let me know when you've completed this step! 🚀
