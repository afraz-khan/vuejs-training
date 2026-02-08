# Lambda Shared Code

Shared code used across all Lambda functions.

## Structure
shared/ ├── config/ │ └── database.js # Sequelize configuration ├── models/ │ ├── index.js # Model loader and Sequelize instance │ ├── Asset.js # Asset model definition │ └── test.js # Model tests ├── package.json # Dependencies └── README.md # This file


## Models

### Asset Model

Represents an asset uploaded by a user.

**Fields**:
- `id` (UUID): Primary key
- `ownerId` (String): Cognito user ID
- `name` (String): Asset name
- `description` (Text): Asset description
- `category` (String): Asset category (image, document, video, other)
- `imageKey` (String): S3 object key
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- `idx_ownerId`: Fast lookup by owner
- `idx_category`: Fast filtering by category
- `idx_createdAt`: Fast sorting by date

## Usage in Lambda Functions

```javascript
const { Asset } = require('/opt/nodejs/models')

// Create asset
const asset = await Asset.create({
  ownerId: 'user-123',
  name: 'My Asset',
  category: 'image',
})

// Find assets
const assets = await Asset.findAll({
  where: { ownerId: 'user-123' },
  order: [['createdAt', 'DESC']],
})

// Update asset
await asset.update({ name: 'New Name' })

// Delete asset
await asset.destroy()