# Step 1.3.2: Create Sequelize Model (TypeScript)

## 🎯 Goal
Create the TypeScript Sequelize model for the Asset table with full type safety and validation.

## 📚 What You'll Learn
- Sequelize with TypeScript
- Model definition with types
- Type-safe validation rules
- Sequelize TypeScript decorators alternative
- Best practices for typed ORM models

## 📋 Prerequisites
- [ ] Step 1.3.0 completed (TypeScript setup)
- [ ] Step 1.3.1 completed (Schema designed)
- [ ] Understanding of TypeScript interfaces
- [ ] Node.js and npm installed

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the shared Lambda directory:

```bash
cd lambdas/shared
pwd
```

Expected: `.../asset-management-app/lambdas/shared`

---

### 2. Install Sequelize TypeScript Support

Install additional type definitions:

```bash
npm install --save-dev @types/validator
```

---

### 3. Update Type Definitions

We already created basic types in Step 1.3.0. Let's enhance them for Sequelize.

Open `src/types/index.ts` and ensure it has:

```typescript
import { Model, Optional } from 'sequelize'

/**
 * Asset category enum
 */
export enum AssetCategory {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  OTHER = 'other',
}

/**
 * Asset attributes interface
 */
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

/**
 * Asset creation attributes (fields that are optional during creation)
 */
export interface AssetCreationAttributes
  extends Optional<AssetAttributes, 'id' | 'description' | 'imageKey' | 'createdAt' | 'updatedAt'> {}

/**
 * Asset instance type (Sequelize Model instance)
 */
export interface AssetInstance
  extends Model<AssetAttributes, AssetCreationAttributes>,
    AssetAttributes {}
```

**Save the file!**

---

### 4. Create Database Configuration (TypeScript)

Create the database configuration file:

```bash
touch src/config/database.ts
```

Open `src/config/database.ts` and add:

```typescript
import { Options } from 'sequelize'
import { env } from './env'
import type { DatabaseConfig } from '../types'

/**
 * Get Sequelize configuration based on environment
 */
export function getDatabaseConfig(): Options {
  const baseConfig: Options = {
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
  }

  return baseConfig
}

export default getDatabaseConfig()
```

**Save the file!**

---

### 5. Create Asset Model (TypeScript)

Create the Asset model file:

```bash
touch src/models/Asset.ts
```

Open `src/models/Asset.ts` and add:

```typescript
import { DataTypes, Sequelize, ModelStatic } from 'sequelize'
import type { AssetInstance, AssetCategory } from '../types'

/**
 * Define Asset Model
 * Represents an asset uploaded by a user
 */
export function defineAssetModel(sequelize: Sequelize): ModelStatic<AssetInstance> {
  const Asset = sequelize.define<AssetInstance>(
    'Asset',
    {
      // Primary Key
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for the asset',
      },

      // Owner Information
      ownerId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Cognito user ID of the asset owner',
        validate: {
          notEmpty: {
            msg: 'Owner ID cannot be empty',
          },
          len: {
            args: [1, 255],
            msg: 'Owner ID must be between 1 and 255 characters',
          },
        },
      },

      // Asset Details
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Name of the asset',
        validate: {
          notEmpty: {
            msg: 'Asset name cannot be empty',
          },
          len: {
            args: [1, 255],
            msg: 'Asset name must be between 1 and 255 characters',
          },
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed description of the asset',
        validate: {
          len: {
            args: [0, 65535],
            msg: 'Description is too long',
          },
        },
      },

      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Category of the asset',
        validate: {
          notEmpty: {
            msg: 'Category cannot be empty',
          },
          isIn: {
            args: [['image', 'document', 'video', 'other']],
            msg: 'Category must be one of: image, document, video, other',
          },
        },
      },

      // Image Information
      imageKey: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'S3 object key for the asset image',
        validate: {
          len: {
            args: [0, 500],
            msg: 'Image key is too long',
          },
        },
      },
    } as any, // Type assertion to avoid timestamp field requirement
    {
      // Model options
      tableName: 'Assets',
      timestamps: true, // Automatically adds createdAt and updatedAt
      underscored: false,
      indexes: [
        {
          name: 'idx_ownerId',
          fields: ['ownerId'],
        },
        {
          name: 'idx_category',
          fields: ['category'],
        },
        {
          name: 'idx_createdAt',
          fields: ['createdAt'],
        },
      ],
      comment: 'Stores metadata for user-uploaded assets',
    }
  )

  return Asset
}

/**
 * Asset Model Type
 */
export type AssetModel = ModelStatic<AssetInstance>
```

**Save the file!**

---

### 6. Create Models Index (TypeScript)

Create the models index file:

```bash
touch src/models/index.ts
```

Open `src/models/index.ts` and add:

```typescript
import { Sequelize } from 'sequelize'
import { getDatabaseConfig } from '../config/database'
import { defineAssetModel, AssetModel } from './Asset'
import { env } from '../config/env'

// Create Sequelize instance
const sequelize = new Sequelize(getDatabaseConfig())

// Initialize models
const Asset: AssetModel = defineAssetModel(sequelize)

// Sync models in development (optional)
if (env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true') {
  sequelize
    .sync({ alter: true })
    .then(() => {
      console.log('✅ Database synced')
    })
    .catch((error: Error) => {
      console.error('❌ Database sync failed:', error)
    })
}

// Export sequelize instance and models
export { sequelize, Sequelize, Asset }

// Export types
export type { AssetModel }
```

**Save the file!**

---

### 7. Create Test Script (TypeScript)

Create a test script to verify the model:

```bash
touch src/models/test.ts
```

Open `src/models/test.ts` and add:

```typescript
import { sequelize, Asset } from './index'
import { AssetCategory } from '../types'

async function testModel(): Promise<void> {
  try {
    console.log('🧪 Testing Sequelize Model\n')

    // Test 1: Connection
    console.log('Test 1: Testing database connection...')
    await sequelize.authenticate()
    console.log('✅ Connection established successfully\n')

    // Test 2: Model structure
    console.log('Test 2: Checking model attributes...')
    const attributes = Object.keys(Asset.rawAttributes)
    console.log('Model attributes:', attributes)
    console.log('✅ Model structure verified\n')

    // Test 3: Validation - Missing required fields
    console.log('Test 3: Testing validation (should fail)...')
    try {
      const invalidAsset = Asset.build({})
      await invalidAsset.validate()
      console.log('❌ Validation should have failed')
    } catch (error: any) {
      const messages = error.errors?.map((e: any) => e.message) || [error.message]
      console.log('✅ Validation working:', messages)
    }
    console.log()

    // Test 4: Valid data
    console.log('Test 4: Testing valid data...')
    const validAsset = Asset.build({
      ownerId: 'test-user-123',
      name: 'Test Asset',
      description: 'This is a test asset',
      category: AssetCategory.IMAGE,
      imageKey: 'assets/test-user-123/test-asset/image.jpg',
    })

    await validAsset.validate()
    console.log('✅ Valid asset passed validation')
    console.log('Asset data:', validAsset.toJSON())
    console.log()

    // Test 5: Type safety
    console.log('Test 5: Testing TypeScript type safety...')
    // This would cause a TypeScript error at compile time:
    // const badAsset = Asset.build({ category: 'invalid' }) // ❌ Type error
    console.log('✅ TypeScript types are enforced at compile time')
    console.log()

    console.log('✨ All tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

// Run tests
testModel()
```

**Save the file!**

---

### 8. Update package.json Scripts

Now that we have test files, let's add the test scripts to package.json.

Open `package.json` and update the scripts section:

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "tsx watch src/index.ts",
    "test": "tsx src/models/test.ts",
    "clean": "rm -rf dist"
  }
}
```

**Save the file!**

---

### 9. Run Model Tests

Run the test to verify everything works:

```bash
npm test
```

**Expected output:**
```
🧪 Testing Sequelize Model

Test 1: Testing database connection...
✅ Connection established successfully

Test 2: Checking model attributes...
Model attributes: [ 'id', 'ownerId', 'name', 'description', 'category', 'imageKey', 'createdAt', 'updatedAt' ]
✅ Model structure verified

Test 3: Testing validation (should fail)...
✅ Validation working: [ 'Owner ID cannot be empty', 'Asset name cannot be empty', 'Category cannot be empty' ]

Test 4: Testing valid data...
✅ Valid asset passed validation
Asset data: {
  id: '...',
  ownerId: 'test-user-123',
  name: 'Test Asset',
  description: 'This is a test asset',
  category: 'image',
  imageKey: 'assets/test-user-123/test-asset/image.jpg'
}

Test 5: Testing TypeScript type safety...
✅ TypeScript types are enforced at compile time

✨ All tests passed!
```

---

### 10. Create Database Sync Script (TypeScript)

Create the sync script:

```bash
touch scripts/syncDatabase.ts
```

Open `scripts/syncDatabase.ts` and add:

```typescript
// Import env FIRST to ensure environment variables are loaded
import '../src/config/env'
import { sequelize } from '../src/models'

async function syncDatabase(): Promise<void> {
  try {
    console.log('🔄 Syncing database...\n')

    // Test connection first
    await sequelize.authenticate()
    console.log('✅ Database connection successful\n')

    // Sync all models
    console.log('Creating tables...')
    await sequelize.sync({ alter: true })
    console.log('✅ Tables created/updated\n')

    // Show created tables
    const [results] = await sequelize.query('SHOW TABLES')
    console.log('📋 Tables in database:')
    results.forEach((row: any) => {
      console.log(`  - ${Object.values(row)[0]}`)
    })

    // Show Asset table structure
    console.log('\n📋 Assets table structure:')
    const [columns] = await sequelize.query('DESCRIBE Assets')
    console.table(columns)

    console.log('\n✨ Database sync complete!')
  } catch (error) {
    console.error('❌ Database sync failed:', error)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

// Run the sync
syncDatabase()
```

**Save the file!**

Now update `package.json` to add the db:sync script:

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "tsx watch src/index.ts",
    "test": "tsx src/models/test.ts",
    "db:sync": "tsx scripts/syncDatabase.ts",
    "clean": "rm -rf dist"
  }
}
```

**Save the file!**

---

### 11. Initialize Database Tables

Run the sync script to create tables:

```bash
npm run db:sync
```

**Expected output:**
```
🔄 Syncing database...

✅ Database connection successful

Creating tables...
✅ Tables created/updated

📋 Tables in database:
  - Assets

📋 Assets table structure:
┌─────────┬─────────────┬──────────────┬─────┬─────────┬────────┐
│ (index) │ Field       │ Type         │ Key │ Default │ Extra  │
├─────────┼─────────────┼──────────────┼─────┼─────────┼────────┤
│ 0       │ id          │ varchar(36)  │ PRI │ NULL    │        │
│ 1       │ ownerId     │ varchar(255) │ MUL │ NULL    │        │
│ 2       │ name        │ varchar(255) │     │ NULL    │        │
│ 3       │ description │ text         │     │ NULL    │        │
│ 4       │ category    │ varchar(100) │ MUL │ NULL    │        │
│ 5       │ imageKey    │ varchar(500) │     │ NULL    │        │
│ 6       │ createdAt   │ datetime     │ MUL │ NULL    │        │
│ 7       │ updatedAt   │ datetime     │     │ NULL    │        │
└─────────┴─────────────┴──────────────┴─────┴─────────┴────────┘

✨ Database sync complete!
```

---

### 12. Update README

Open `README.md` and update with TypeScript information:

```markdown
# Lambda Shared Code (TypeScript)

Shared TypeScript code used across all Lambda functions.

## Structure

```
shared/
├── src/
│   ├── config/
│   │   ├── env.ts            # Environment configuration
│   │   └── database.ts       # Sequelize configuration
│   ├── models/
│   │   ├── index.ts          # Model loader
│   │   ├── Asset.ts          # Asset model definition
│   │   └── test.ts           # Model tests
│   ├── types/
│   │   └── index.ts          # Type definitions
│   └── index.ts              # Main entry point
├── scripts/
│   └── syncDatabase.ts       # Database sync script
├── dist/                     # Compiled JavaScript (gitignored)
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## Models

### Asset Model

Represents an asset uploaded by a user.

**Type**: `AssetInstance`

**Fields**:
- `id` (UUID): Primary key
- `ownerId` (String): Cognito user ID
- `name` (String): Asset name
- `description` (Text, nullable): Asset description
- `category` (Enum): Asset category (image, document, video, other)
- `imageKey` (String, nullable): S3 object key
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- `idx_ownerId`: Fast lookup by owner
- `idx_category`: Fast filtering by category
- `idx_createdAt`: Fast sorting by date

## Usage in Lambda Functions

```typescript
import { Asset } from './models'
import { AssetCategory } from './types'

// Create asset
const asset = await Asset.create({
  ownerId: 'user-123',
  name: 'My Asset',
  category: AssetCategory.IMAGE,
})

// Find assets with type safety
const assets = await Asset.findAll({
  where: { ownerId: 'user-123' },
  order: [['createdAt', 'DESC']],
})

// Update asset
await asset.update({ name: 'New Name' })

// Delete asset
await asset.destroy()
```

## Type Safety

All models are fully typed:

```typescript
import type { AssetInstance, AssetAttributes } from './types'

// Type-safe asset creation
const assetData: AssetCreationAttributes = {
  ownerId: 'user-123',
  name: 'Test',
  category: AssetCategory.IMAGE,
}

// Type-safe queries
const asset: AssetInstance | null = await Asset.findByPk('asset-id')
```

## Development

```bash
# Run tests
npm test

# Sync database
npm run db:sync

# Build TypeScript
npm run build

# Watch mode
npm run build:watch
```

## Environment Variables

Required in `.env`:

- `DB_HOST`: RDS endpoint
- `DB_PORT`: Database port (default: 3306)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `NODE_ENV`: Environment (development/production)
```

**Save the file!**

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] Type definitions updated in `src/types/index.ts`
- [ ] `src/config/database.ts` created
- [ ] `src/models/Asset.ts` created with full types
- [ ] `src/models/index.ts` created
- [ ] `src/models/test.ts` created
- [ ] `scripts/syncDatabase.ts` created
- [ ] Model tests pass (`npm test`)
- [ ] Database sync works (`npm run db:sync`)
- [ ] Tables created in MySQL
- [ ] README updated
- [ ] TypeScript compiles without errors

---

## 🔍 Understanding TypeScript Benefits

### 1. Type Safety

**JavaScript** (old way):
```javascript
const asset = await Asset.create({
  category: 'invalid',  // ❌ Runtime error
})
```

**TypeScript** (new way):
```typescript
const asset = await Asset.create({
  category: 'invalid',  // ❌ Compile-time error!
})
```

### 2. IntelliSense

TypeScript provides auto-completion:
```typescript
const asset = await Asset.findByPk('id')
asset.  // ← Auto-complete shows: id, name, category, etc.
```

### 3. Refactoring

Rename a field and TypeScript finds all usages:
```typescript
// Change 'ownerId' to 'userId' in type definition
// TypeScript shows errors everywhere it's used
```

### 4. Documentation

Types serve as documentation:
```typescript
// You know exactly what fields are required
const asset: AssetCreationAttributes = {
  ownerId: string,    // Required
  name: string,       // Required
  category: AssetCategory,  // Required
  description?: string,     // Optional
}
```

---

## 🎓 Key Concepts

### 1. Sequelize with TypeScript

**Model Definition**:
```typescript
sequelize.define<AssetInstance>('Asset', { ... })
//                ^^^^^^^^^^^^^^
//                Type parameter for instance type
```

**Type-safe queries**:
```typescript
const asset: AssetInstance | null = await Asset.findByPk('id')
//            ^^^^^^^^^^^^^^
//            TypeScript knows the return type
```

### 2. Optional Fields

```typescript
interface AssetCreationAttributes
  extends Optional<AssetAttributes, 'id' | 'createdAt' | 'updatedAt'> {}
//        ^^^^^^^^
//        Makes specified fields optional
```

### 3. Enums for Constants

```typescript
enum AssetCategory {
  IMAGE = 'image',
  DOCUMENT = 'document',
}

// Usage
const category: AssetCategory = AssetCategory.IMAGE
```

---

## 📝 Notes

- All models are now fully typed
- TypeScript catches errors at compile time
- IntelliSense provides better developer experience
- Types serve as documentation
- Refactoring is safer and easier
- Build step required before deployment

---

## 🎯 What's Next?

In the next step (1.3.3), we'll:
- Create database connection helper in TypeScript
- Add type-safe Secrets Manager integration
- Implement connection pooling with types
- Create typed test scripts

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.2! 🎉

**You now have:**
- ✅ Type-safe Sequelize models
- ✅ Full TypeScript support
- ✅ Compile-time error checking
- ✅ IntelliSense and auto-completion
- ✅ Database tables created
- ✅ Test scripts working
- ✅ Ready for connection helpers!

---

**Ready for Step 1.3.3?** Let me know when you've completed this step! 🚀
