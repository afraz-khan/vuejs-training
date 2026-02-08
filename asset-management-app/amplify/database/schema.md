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