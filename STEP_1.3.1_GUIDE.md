# Step 1.3.1: Design RDS Schema

## 🎯 Goal
Design the database schema for the Asset table in RDS MySQL, planning all fields, types, and relationships.

## 📚 What You'll Learn
- Database schema design principles
- MySQL data types
- Primary and foreign keys
- Indexes for performance
- Sequelize model structure
- Data validation at database level

## 📋 Prerequisites
- [ ] Phase 1.2 completed (Authentication working)
- [ ] Understanding of relational databases
- [ ] Basic SQL knowledge

## 🚀 Step-by-Step Instructions

### 1. Understanding the Requirements

From the assignment, we need to store:
- Asset metadata (name, description, category)
- Owner information (which user owns the asset)
- Image reference (S3 key/URL)
- Timestamps (created, updated)

---

### 2. Asset Table Schema Design

Let's design the `Assets` table:

```sql
CREATE TABLE Assets (
  -- Primary Key
  id VARCHAR(36) PRIMARY KEY,
  
  -- Owner Information
  ownerId VARCHAR(255) NOT NULL,
  
  -- Asset Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  
  -- Image Information
  imageKey VARCHAR(500),
  
  -- Timestamps
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  
  -- Indexes for performance
  INDEX idx_ownerId (ownerId),
  INDEX idx_category (category),
  INDEX idx_createdAt (createdAt)
);
```

---

### 3. Field Descriptions

Let's understand each field:

#### **id** (VARCHAR(36), PRIMARY KEY)
- Unique identifier for each asset
- We'll use UUID v4 (36 characters with hyphens)
- Example: `"550e8400-e29b-41d4-a716-446655440000"`
- **Why UUID?** Distributed systems, no collision risk, secure

#### **ownerId** (VARCHAR(255), NOT NULL)
- Cognito user ID of the asset owner
- Links asset to authenticated user
- Used for authorization (users can only access their own assets)
- **Indexed** for fast queries by owner

#### **name** (VARCHAR(255), NOT NULL)
- Asset name/title
- Required field
- Max 255 characters
- Example: `"Company Logo"`, `"Product Photo"`

#### **description** (TEXT, NULLABLE)
- Detailed description of the asset
- Optional field
- Can be long text (up to 65,535 characters in MySQL)
- Example: `"High-resolution logo for marketing materials"`

#### **category** (VARCHAR(100), NOT NULL)
- Asset category/type
- Required field
- Examples: `"image"`, `"document"`, `"video"`, `"other"`
- **Indexed** for filtering by category

#### **imageKey** (VARCHAR(500), NULLABLE)
- S3 object key (path in S3 bucket)
- Example: `"assets/user123/asset456/image.jpg"`
- Used to retrieve/delete from S3
- Nullable (asset might not have image yet)
- **Note**: Pre-signed URLs will be generated on-demand in the API response, not stored

#### **createdAt** (DATETIME, NOT NULL)
- When the asset was created
- Automatically set by Sequelize
- Used for sorting, filtering

#### **updatedAt** (DATETIME, NOT NULL)
- When the asset was last updated
- Automatically updated by Sequelize
- Used for tracking changes

---

### 4. Indexes Explained

**Why Indexes?**
- Speed up queries
- Essential for large datasets
- Trade-off: Slower writes, faster reads

**Our Indexes**:

1. **idx_ownerId**: Fast lookup of user's assets
   ```sql
   SELECT * FROM Assets WHERE ownerId = 'user123'
   ```

2. **idx_category**: Fast filtering by category
   ```sql
   SELECT * FROM Assets WHERE category = 'image'
   ```

3. **idx_createdAt**: Fast sorting by date
   ```sql
   SELECT * FROM Assets ORDER BY createdAt DESC
   ```

---

### 5. Sequelize Model Structure

Here's how this translates to Sequelize (we'll implement this in the next step):

```javascript
const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ownerId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['image', 'document', 'video', 'other']],
    },
  },
  imageKey: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  indexes: [
    { fields: ['ownerId'] },
    { fields: ['category'] },
    { fields: ['createdAt'] },
  ],
})
```

---

### 6. Data Validation Rules

**At Database Level**:
- NOT NULL constraints
- VARCHAR length limits
- Primary key uniqueness

**At Application Level (Sequelize)**:
- `notEmpty`: Field cannot be empty string
- `len`: Length validation
- `isIn`: Value must be in allowed list
- Custom validators (we can add more)

---

### 7. Sample Data

Here's what a record will look like:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ownerId": "us-east-1:12345678-1234-1234-1234-123456789012",
  "name": "Company Logo",
  "description": "Official company logo for marketing materials",
  "category": "image",
  "imageKey": "assets/us-east-1:12345678-1234-1234-1234-123456789012/550e8400-e29b-41d4-a716-446655440000/logo.png",
  "createdAt": "2026-02-06T10:30:00.000Z",
  "updatedAt": "2026-02-06T10:30:00.000Z"
}
```

**Note**: When the API returns this asset, it will generate a pre-signed URL on-the-fly from the `imageKey` and include it in the response. The URL is never stored in the database.

---

### 8. Security Considerations

**Row-Level Security**:
- Every query MUST filter by `ownerId`
- Users can only see/modify their own assets
- Implemented in Lambda functions, not database

**Why not database-level RLS?**
- MySQL doesn't have built-in RLS like PostgreSQL
- We'll implement in application layer (Lambda)
- Each Lambda will verify user owns the asset

---

### 9. Scalability Considerations

**Current Design**:
- Single table (simple)
- Indexes for common queries
- UUID for distributed systems

**Future Enhancements** (not needed now):
- Partitioning by ownerId (for millions of users)
- Separate table for asset versions
- Full-text search on description
- Soft deletes (deletedAt field)

---

### 10. Create Schema Documentation

Create a file to document this schema:

```bash
touch amplify/database/schema.md
```

Wait, we need to create the directory first:

```bash
mkdir -p amplify/database
touch amplify/database/schema.md
```

Add this content to `amplify/database/schema.md`:

```markdown
# Database Schema

## Assets Table

Stores metadata for user-uploaded assets.

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| ownerId | VARCHAR(255) | No | Cognito user ID |
| name | VARCHAR(255) | No | Asset name |
| description | TEXT | Yes | Asset description |
| category | VARCHAR(100) | No | Asset category (image, document, video, other) |
| imageKey | VARCHAR(500) | Yes | S3 object key |
| createdAt | DATETIME | No | Creation timestamp |
| updatedAt | DATETIME | No | Last update timestamp |

### Indexes

- `idx_ownerId`: Fast lookup by owner
- `idx_category`: Fast filtering by category
- `idx_createdAt`: Fast sorting by date

### Constraints

- Primary Key: `id`
- NOT NULL: `id`, `ownerId`, `name`, `category`, `createdAt`, `updatedAt`
- Unique: `id`

### Image URL Generation

Pre-signed URLs are **generated on-demand** in the API response, not stored in the database:

```javascript
// In Lambda function
const { getUrl } = require('aws-amplify/storage');

// Generate pre-signed URL from imageKey
if (asset.imageKey) {
  const signedUrl = await getUrl({ key: asset.imageKey });
  asset.imageUrl = signedUrl.url.toString(); // Add to response only
}
```

**Why not store URLs?**
- Pre-signed URLs expire (15 min - 7 days)
- They contain temporary credentials
- They're long and waste storage
- Should be generated fresh for each request

### Sample Query Patterns

```sql
-- Get all assets for a user
SELECT * FROM Assets WHERE ownerId = ? ORDER BY createdAt DESC;

-- Get assets by category
SELECT * FROM Assets WHERE ownerId = ? AND category = ?;

-- Get single asset
SELECT * FROM Assets WHERE id = ? AND ownerId = ?;

-- Update asset
UPDATE Assets SET name = ?, description = ?, updatedAt = NOW() 
WHERE id = ? AND ownerId = ?;

-- Delete asset
DELETE FROM Assets WHERE id = ? AND ownerId = ?;
```

### Security

- All queries MUST include `ownerId` filter
- Users can only access their own assets
- Implemented in Lambda authorization layer
```

**Save the file!**

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] Understand all field types and purposes
- [ ] Understand why we use UUID for id
- [ ] Understand the purpose of each index
- [ ] Understand ownerId for user isolation
- [ ] Understand validation rules
- [ ] Schema documentation created
- [ ] Ready to implement Sequelize model

---

## 🔍 Understanding What You Designed

### Database Design Principles Applied

1. **Normalization**: Single table for assets (simple, no joins needed)
2. **Indexing**: Strategic indexes for common queries
3. **Data Types**: Appropriate types for each field
4. **Constraints**: NOT NULL where required
5. **Timestamps**: Track creation and updates
6. **Security**: ownerId for row-level security

### Why This Design?

**Simple**:
- One table, easy to understand
- No complex relationships (yet)
- Easy to query and maintain

**Secure**:
- ownerId ensures user isolation
- UUID prevents ID guessing
- Validation at multiple levels

**Scalable**:
- Indexes for performance
- UUID for distributed systems
- Can add more tables later

**Flexible**:
- TEXT for description (any length)
- Category enum (easy to extend)
- Nullable fields where appropriate

---

## 🎓 Key Concepts

### 1. UUID vs Auto-Increment

**Auto-Increment** (1, 2, 3, ...):
- ✅ Simple, sequential
- ❌ Predictable (security risk)
- ❌ Doesn't work well in distributed systems
- ❌ Can expose business metrics (asset count)

**UUID** (550e8400-e29b-41d4-a716-446655440000):
- ✅ Globally unique
- ✅ Unpredictable (more secure)
- ✅ Works in distributed systems
- ✅ Can be generated client-side
- ❌ Longer (36 chars vs 10 digits)

### 2. VARCHAR vs TEXT

**VARCHAR(n)**:
- Fixed maximum length
- Faster for short strings
- Can be indexed efficiently
- Use for: names, categories, keys

**TEXT**:
- Variable length (up to 65KB)
- Slower for very long strings
- Harder to index
- Use for: descriptions, content

### 3. Indexes

**When to Index**:
- Columns used in WHERE clauses
- Columns used in ORDER BY
- Foreign keys

**When NOT to Index**:
- Small tables (< 1000 rows)
- Columns rarely queried
- Columns with low cardinality (few unique values)

**Trade-offs**:
- Faster reads
- Slower writes
- More storage

### 4. Timestamps

**createdAt**:
- Never changes
- Good for sorting (newest first)
- Good for analytics

**updatedAt**:
- Changes on every update
- Good for tracking changes
- Good for caching (check if stale)

### 5. Nullable vs NOT NULL

**NOT NULL**:
- Field is required
- Database enforces
- Prevents null pointer errors

**NULLABLE**:
- Field is optional
- Can be added later
- More flexible

**Rule of Thumb**: Make fields NOT NULL unless there's a good reason

---

## 📝 Notes

- This is a simple schema for learning
- Production apps might have more tables (users, permissions, etc.)
- We're not using foreign keys (Cognito users are external)
- We're not using soft deletes (can add later)
- We're not using versioning (can add later)
- Focus is on learning the basics well

---

## 🎯 What's Next?

In the next step (1.3.2), we'll:
- Create the Sequelize model based on this schema
- Add validation rules
- Test the model structure
- Prepare for Lambda integration

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.1! 🎉

**You now have:**
- ✅ Complete database schema design
- ✅ Understanding of all fields and types
- ✅ Index strategy for performance
- ✅ Security considerations documented
- ✅ Schema documentation file
- ✅ Ready to implement!

---

## 📸 Expected Final State

Your project structure should look like:
```
asset-management-app/
├── amplify/
│   ├── auth/
│   ├── storage/
│   ├── backend.ts
│   └── database/
│       └── schema.md        # ← NEW! Schema documentation
└── frontend/
    └── ...
```

---

**Ready for Step 1.3.2?** Let me know when you've reviewed the schema and created the documentation! 🚀
