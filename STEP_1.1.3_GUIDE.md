# Step 1.1.3: Configure S3 Storage

## 🎯 Goal
Set up AWS S3 storage to allow users to upload and store asset images.

## 📚 What You'll Learn
- How to configure S3 storage in Amplify Gen 2
- Understanding storage access permissions
- How to organize files in S3 buckets
- Public vs authenticated access

## 📋 Prerequisites
- [ ] Step 1.1.2 completed (Auth configured)
- [ ] You're in the `asset-management-app` directory
- [ ] `amplify/auth/resource.ts` exists

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the right directory:

```bash
pwd
```

Expected: `/Users/apple/.../vuejs-training/asset-management-app`

---

### 2. Create the Storage Folder
Create a folder for storage configuration:

```bash
mkdir -p amplify/storage
```

---

### 3. Verify Folder Created
Check that the folder exists:

```bash
ls -la amplify/
```

You should see:
```
amplify/
├── auth/
├── data/
├── storage/        # ← NEW!
├── backend.ts
└── package.json
```

---

### 4. Create the Storage Resource File
Create the storage configuration file:

```bash
touch amplify/storage/resource.ts
```

---

### 5. Add Storage Configuration
Open the file `amplify/storage/resource.ts` in your editor and add this code:

```typescript
import { defineStorage } from '@aws-amplify/backend';

/**
 * Define and configure your storage resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/storage
 */
export const storage = defineStorage({
  name: 'assetImages',
  access: (allow) => ({
    // Path pattern: assets/{userId}/{assetId}/filename.jpg
    // This provides better organization and user isolation
    'assets/{entity_id}/*': [
      // {entity_id} will be replaced with the user's Cognito ID
      // Users can only access files in their own folder
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
});
```

**Save the file!**

---

### 6. Understanding the Configuration

Let's break down what each part does:

**`name: 'assetImages'`**
- The name of your S3 bucket
- AWS will create a bucket with this name (plus some random characters)
- Used to identify this storage resource

**`access: (allow) => ({ ... })`**
- Defines who can access what files
- Uses path-based permissions with user isolation

**`'assets/{entity_id}/*'`**
- Path pattern for organizing files by user
- `{entity_id}` is automatically replaced with the user's Cognito ID
- `/*` means all files in that user's folder
- Example: `assets/user-123/asset-abc/image.jpg`

**`allow.entity('identity').to(['read', 'write', 'delete'])`**
- `entity('identity')` means the authenticated user
- Users can ONLY access files in their own folder (where {entity_id} = their user ID)
- They can:
  - Read their own files (view images)
  - Write their own files (upload images)
  - Delete their own files (remove images)
- They CANNOT access other users' folders

**Security Benefit:**
- S3-level isolation: Users physically cannot access other users' files
- Even if someone tries to guess another user's path, S3 will deny access
- Automatic enforcement by AWS - no custom code needed

---

### 7. Update backend.ts to Include Storage
Now we need to tell Amplify to use this storage configuration.

Open `amplify/backend.ts` and replace its contents with:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  storage,
});
```

**Save the file!**

---

### 8. Verify Your Files
Let's check that everything is in place:

```bash
# Check storage resource file exists
ls -la amplify/storage/resource.ts

# Check backend.ts was updated
cat amplify/backend.ts
```

You should see both auth and storage imported in backend.ts.

---

### 9. Check for Syntax Errors
Let's make sure there are no TypeScript errors:

```bash
npx tsc --noEmit --project amplify/tsconfig.json
```

Expected output:
```
# If successful, no output (silence means success!)
```

If you see errors, double-check your code matches exactly!

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `amplify/storage/` folder exists
- [ ] `amplify/storage/resource.ts` file exists
- [ ] `resource.ts` contains the storage configuration code
- [ ] `amplify/backend.ts` imports storage
- [ ] `amplify/backend.ts` includes storage in defineBackend
- [ ] `npx tsc --noEmit --project amplify/tsconfig.json` completes without errors
- [ ] No typos in the code

---

## 🔍 Understanding What You Built

### What is AWS S3?
S3 (Simple Storage Service) is AWS's object storage service that:
- Stores files (images, videos, documents, etc.)
- Highly scalable and durable
- Pay only for what you use
- Accessible via URLs
- Integrated with other AWS services

### Why Do We Need Storage?
In our asset management app:
- Users upload images for their assets
- Images need to be stored somewhere
- S3 is perfect for this use case
- Images are accessible via URLs
- Can be displayed in the frontend

### Access Patterns Explained

**Path Structure: `assets/{userId}/{assetId}/*`**
- Organizes files by user first, then by asset
- Each user has their own isolated folder
- Each asset within a user's folder has its own subfolder
- Easy to find all files for a user
- Easy to find all files for a specific asset
- Example structure:
  ```
  assets/
  ├── user-abc123/              # User 1's folder
  │   ├── asset-001/
  │   │   └── laptop.jpg
  │   └── asset-002/
  │       └── monitor.png
  └── user-def456/              # User 2's folder
      └── asset-003/
          └── keyboard.jpg
  ```

**User Isolation at S3 Level**
- `{entity_id}` is replaced with the authenticated user's Cognito ID
- User `abc123` can ONLY access `assets/abc123/*`
- User `def456` can ONLY access `assets/def456/*`
- S3 enforces this automatically - no custom code needed
- Even if User 1 tries to access `assets/def456/asset-003/keyboard.jpg`, S3 will deny it

**Benefits of This Structure:**
1. **Security**: Physical isolation at storage level
2. **Organization**: Clear user boundaries
3. **Management**: Easy to list all assets for a user
4. **Cleanup**: Easy to delete all data for a user (GDPR)
5. **Quotas**: Can implement per-user storage limits
6. **Debugging**: Easy to find a specific user's files
7. **Scalability**: Works well even with millions of users

### What Happens Behind the Scenes?
When you deploy this configuration, Amplify will:
1. Create an S3 bucket in your AWS account
2. Configure bucket policies for access control
3. Set up CORS for web access
4. Generate client configuration for uploads
5. Create IAM roles for authenticated users

---

## 🎓 Key Concepts

### 1. defineStorage()
- Amplify Gen 2 function to configure S3 storage
- Type-safe configuration
- Validates your settings before deployment

### 2. Path-Based Access Control
- Different paths can have different permissions
- Flexible and powerful
- Easy to understand and maintain

### 3. Entity ID Pattern
- `{entity_id}` is replaced with actual IDs at runtime
- Keeps files organized
- Prevents file name conflicts

### 4. Permission Levels
- **read**: View/download files
- **write**: Upload/update files
- **delete**: Remove files

### 5. Guest vs Authenticated
- **Guest**: Not logged in, limited access
- **Authenticated**: Logged in, full access
- Security best practice

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@aws-amplify/backend'"
**Solution**: 
```bash
npm install
```

### Issue: TypeScript errors in resource.ts
**Solution**: 
- Check for typos
- Make sure you copied the code exactly
- Verify the file is saved
- Try: `npx tsc --noEmit --project amplify/tsconfig.json` again

### Issue: "storage is not defined" in backend.ts
**Solution**: 
- Make sure you imported storage: `import { storage } from './storage/resource';`
- Check the path is correct
- Verify resource.ts exports storage: `export const storage = ...`

### Issue: Folder not created
**Solution**: 
```bash
# Create it manually
mkdir -p amplify/storage
```

---

## 📝 Notes

- We haven't deployed anything yet - this is just configuration
- The actual S3 bucket will be created when we deploy (next steps)
- You can change access permissions later if needed
- File size limits can be configured (default is 5GB per file)
- S3 is very cheap - typically pennies per month for small apps

---

## 🎯 What's Next?

In the next step (1.1.4), we'll:
- Deploy the backend to AWS sandbox
- Create the Cognito User Pool
- Create the S3 bucket
- Test that everything works

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.1.3! 🎉

**You now have:**
- ✅ S3 storage configured
- ✅ Access permissions defined
- ✅ File organization structure set up
- ✅ Storage integrated into backend

---

## 📸 Expected Final State

Your directory structure should look like:
```
asset-management-app/
├── amplify/
│   ├── auth/
│   │   └── resource.ts
│   ├── data/
│   │   └── resource.ts
│   ├── storage/
│   │   └── resource.ts        # ← NEW! Storage configuration
│   ├── backend.ts             # ← UPDATED! Imports storage
│   ├── package.json
│   └── tsconfig.json
├── node_modules/
├── package.json
├── package-lock.json
└── .gitignore
```

---

## 🔗 Additional Resources

- [Amplify Storage Documentation](https://docs.amplify.aws/gen2/build-a-backend/storage/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [S3 Access Control](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-overview.html)

---

## 💡 Pro Tips

1. **File Naming**: Use descriptive names for uploaded files
2. **File Types**: You can restrict file types if needed (jpg, png, etc.)
3. **File Size**: Consider adding size limits for uploads
4. **Cleanup**: Delete S3 files when assets are deleted
5. **Costs**: S3 is cheap, but monitor usage in production

---

**Ready for Step 1.1.4?** Let me know when you've completed this step and verified everything! 🚀

In the next step, we'll actually deploy this backend to AWS and see it come to life!
