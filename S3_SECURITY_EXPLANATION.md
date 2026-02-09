# S3 Storage Security - User Isolation

## 🔒 Path Structure: `assets/{userId}/{assetId}/*`

### Why This Pattern is Better

#### ❌ Simple Pattern: `assets/{assetId}/*`
```
assets/
├── asset-001/
│   └── laptop.jpg      # Who owns this? Not clear from path
├── asset-002/
│   └── monitor.png     # Could belong to any user
└── asset-003/
    └── keyboard.jpg
```

**Problems:**
- No user isolation at S3 level
- All users' files mixed together
- Harder to manage user data
- Difficult to implement user quotas
- Hard to delete all user data (GDPR)
- Relies entirely on application-level security

#### ✅ Better Pattern: `assets/{userId}/{assetId}/*`
```
assets/
├── user-abc123/              # User 1's isolated folder
│   ├── asset-001/
│   │   └── laptop.jpg
│   └── asset-002/
│       └── monitor.png
└── user-def456/              # User 2's isolated folder
    └── asset-003/
        └── keyboard.jpg
```

**Benefits:**
- ✅ User isolation at S3 level (physical separation)
- ✅ Clear ownership from path structure
- ✅ Easy to list all assets for a user
- ✅ Easy to delete all user data (GDPR compliance)
- ✅ Can implement per-user storage quotas
- ✅ Better debugging and troubleshooting
- ✅ Scales to millions of users

---

## 🛡️ How Security Works

### Configuration
```typescript
export const storage = defineStorage({
  name: 'assetImages',
  access: (allow) => ({
    'assets/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
})
```

### What Happens at Runtime

**User 1 (ID: abc123) logs in:**
- Cognito issues JWT token with `sub: abc123`
- When accessing S3, `{entity_id}` is replaced with `abc123`
- User can access: `assets/abc123/*` ✅
- User CANNOT access: `assets/def456/*` ❌ (S3 denies)

**User 2 (ID: def456) logs in:**
- Cognito issues JWT token with `sub: def456`
- When accessing S3, `{entity_id}` is replaced with `def456`
- User can access: `assets/def456/*` ✅
- User CANNOT access: `assets/abc123/*` ❌ (S3 denies)

---

## 🔐 Security Layers

### Layer 1: S3 Bucket Policy (Automatic)
```
User abc123 tries to access: assets/def456/asset-003/keyboard.jpg
↓
S3 checks: Does abc123 have permission for assets/def456/*?
↓
NO → 403 Forbidden (Access Denied)
```

### Layer 2: Application Logic
```javascript
// Frontend validates ownership before upload
const uploadImage = async (assetId, file, userId) => {
  // 1. Check if user owns the asset (RDS query)
  const asset = await assetStore.fetchAssetById(assetId)
  if (asset.ownerId !== currentUserId) {
    throw new Error('You do not own this asset')
  }
  
  // 2. Upload to user's folder
  const result = await uploadData({
    key: `assets/${userId}/${assetId}/${file.name}`,
    data: file
  }).result
  
  return result.key
}
```

### Layer 3: RDS Database
```
Asset record in RDS:
{
  id: "asset-001",
  name: "Laptop",
  ownerId: "abc123",        ← Owner reference
  imageUrl: "assets/abc123/asset-001/laptop.jpg"  ← Path includes user ID
}
```

---

## 📊 Comparison

| Feature | `assets/{assetId}/*` | `assets/{userId}/{assetId}/*` |
|---------|---------------------|-------------------------------|
| User Isolation | ❌ Application-level only | ✅ S3-level (physical) |
| Security | ⚠️ Relies on app code | ✅ Enforced by AWS |
| Organization | ❌ All files mixed | ✅ Clear user boundaries |
| User Data Deletion | ❌ Complex query needed | ✅ Delete folder: `assets/{userId}/*` |
| Storage Quotas | ❌ Hard to implement | ✅ Easy per-user limits |
| Debugging | ❌ Hard to find user's files | ✅ Easy: list `assets/{userId}/*` |
| GDPR Compliance | ❌ Difficult | ✅ Easy |
| Scalability | ⚠️ Works but not optimal | ✅ Scales to millions |

---

## 🎯 Real-World Example

### Scenario: User wants to delete their account

**With `assets/{assetId}/*`:**
```javascript
// 1. Query RDS for all user's assets
const assets = await Asset.findAll({ where: { ownerId: userId } })

// 2. Loop through each asset
for (const asset of assets) {
  // 3. Parse image URL to get S3 key
  const s3Key = parseImageUrl(asset.imageUrl)
  
  // 4. Delete from S3
  await deleteObject({ key: s3Key })
  
  // 5. Delete from RDS
  await asset.destroy()
}

// Complex, error-prone, slow
```

**With `assets/{userId}/{assetId}/*`:**
```javascript
// 1. Delete entire user folder from S3 (one operation!)
await deleteObject({ key: `assets/${userId}/`, recursive: true })

// 2. Delete all assets from RDS
await Asset.destroy({ where: { ownerId: userId } })

// Simple, fast, reliable
```

---

## 🚀 Frontend Usage

### Uploading an Image
```javascript
import { uploadData } from 'aws-amplify/storage'

// Upload image for an asset
const uploadAssetImage = async (assetId, file) => {
  const { user } = useAuthStore()
  
  // Path automatically scoped to user's folder
  const result = await uploadData({
    key: `assets/${user.id}/${assetId}/${file.name}`,
    data: file
  }).result
  
  // Returns: assets/abc123/asset-001/laptop.jpg
  return result.key
}
```

### Displaying an Image
```javascript
import { getUrl } from 'aws-amplify/storage'

// Get signed URL for image
const getAssetImageUrl = async (imagePath) => {
  // imagePath: assets/abc123/asset-001/laptop.jpg
  const result = await getUrl({ key: imagePath })
  
  // Returns temporary signed URL
  return result.url
}
```

### Deleting an Image
```javascript
import { remove } from 'aws-amplify/storage'

// Delete image
const deleteAssetImage = async (imagePath) => {
  // Only works if user owns the folder (S3 enforces this)
  await remove({ key: imagePath })
}
```

---

## 🎓 Key Takeaways

1. **Defense in Depth**: Multiple security layers
   - S3 bucket policy (AWS-enforced)
   - Application logic (frontend validation)
   - Database constraints (RDS ownership)

2. **Principle of Least Privilege**: Users only access their own data
   - S3 path scoped to user ID
   - Cannot access other users' folders
   - Automatic enforcement by AWS

3. **Better Organization**: Clear data boundaries
   - Easy to find user's files
   - Easy to manage user data
   - Scales well

4. **GDPR Compliance**: Easy data deletion
   - Delete entire user folder
   - One operation instead of many
   - Reliable and fast

5. **Future-Proof**: Supports advanced features
   - Per-user storage quotas
   - User data export
   - Analytics per user
   - Backup/restore per user

---

## ✅ Recommendation

**Always use `assets/{userId}/{assetId}/*` pattern for:**
- Multi-tenant applications
- User-generated content
- Privacy-sensitive data
- GDPR compliance requirements
- Applications that may scale

**This is the industry best practice for S3 storage in user-facing applications!** 🎯
