# Step 1.1.2: Configure Cognito Authentication

## 🎯 Goal
Set up AWS Cognito authentication to allow users to sign up, log in, and log out using email and password.

## 📚 What You'll Learn
- How to configure Cognito in Amplify Gen 2
- Understanding authentication configuration
- What user attributes are and why we need them
- How Amplify manages authentication

## 📋 Prerequisites
- [ ] Step 1.1.1 completed (Amplify project initialized)
- [ ] You're in the `asset-management-app` directory
- [ ] `amplify` folder exists

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the right directory:

```bash
pwd
```

Expected: `/Users/apple/.../vuejs-training/asset-management-app`

---

### 2. Create the Auth Folder
Create a folder for authentication configuration:

```bash
mkdir -p amplify/auth
```

This creates the `auth` folder inside `amplify/`.

---

### 3. Verify Folder Created
Check that the folder exists:

```bash
ls -la amplify/
```

You should see:
```
amplify/
├── auth/           # ← NEW!
├── data/           # (might already exist)
├── backend.ts
└── package.json
```

---

### 4. Create the Auth Resource File
Now create the authentication configuration file:

```bash
touch amplify/auth/resource.ts
```

---

### 5. Add Authentication Configuration
Open the file `amplify/auth/resource.ts` in your editor and add this code:

```typescript
import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    preferredUsername: {
      required: false,
      mutable: true,
    },
  },
});
```

**Save the file!**

---

### 6. Understanding the Configuration

Let's break down what each part does:

**`loginWith: { email: true }`**
- Users will log in with their email address (not username)
- Email will be used as the unique identifier

**`userAttributes`**
- Additional information we store about each user
- `preferredUsername`: Optional display name, can be updated later (mutable: true)
- Email is automatically included when you use `loginWith: { email: true }`

---

### 7. Update backend.ts to Include Auth
Now we need to tell Amplify to use this auth configuration.

Open `amplify/backend.ts` and replace its contents with:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
});
```

**Save the file!**

---

### 8. Verify Your Files
Let's check that everything is in place:

```bash
# Check auth resource file exists
ls -la amplify/auth/resource.ts

# Check backend.ts was updated
cat amplify/backend.ts
```

You should see the auth import and configuration in backend.ts.

---

### 9. Check for Syntax Errors
Let's make sure there are no TypeScript errors:

```bash
npx tsc --noEmit --project amplify/tsconfig.json
```

Expected output:
```
# If successful, no output (silence means success!)
# If there are errors, they will be displayed
```

**Note**: Don't use `sudo` with npm commands!

If you see errors, double-check your code matches exactly!

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `amplify/auth/` folder exists
- [ ] `amplify/auth/resource.ts` file exists
- [ ] `resource.ts` contains the auth configuration code
- [ ] `amplify/backend.ts` imports auth
- [ ] `amplify/backend.ts` includes auth in defineBackend
- [ ] `npx tsc --noEmit --project amplify/tsconfig.json` completes without errors
- [ ] No typos in the code

---

## 🔍 Understanding What You Built

### What is AWS Cognito?
Cognito is AWS's authentication service that handles:
- User registration (sign up)
- User login (sign in)
- Password management
- Email verification
- User sessions and tokens
- Multi-factor authentication (optional)

### Why Email Login?
We chose email login because:
- Users are familiar with it
- Email is unique (no duplicates)
- Easy to verify ownership
- Professional and standard

### User Attributes Explained

**Email (automatically included)**
- Used for login
- Used for verification
- Automatically required when using email login
- Unique across all users

**PreferredUsername (optional, mutable)**
- Display name for the user
- Can be updated in profile settings
- Makes the app more personal
- Not required, so users can skip it during signup

### What Happens Behind the Scenes?
When you deploy this configuration, Amplify will:
1. Create a Cognito User Pool in your AWS account
2. Configure it with email/password authentication
3. Set up email verification
4. Create the necessary IAM roles and policies
5. Generate client configuration for your frontend

---

## 🎓 Key Concepts

### 1. defineAuth()
- Amplify Gen 2 function to configure authentication
- Type-safe configuration
- Validates your settings before deployment

### 2. User Attributes
- Additional data stored with each user
- Can be required or optional
- Can be mutable (changeable) or immutable (fixed)
- Standard attributes: email, name, phone, etc.

### 3. Email Verification
- Automatically enabled when using email login
- Users receive a verification code
- Must verify before they can log in
- Prevents fake accounts

### 4. Resource Files
- Each AWS service gets its own resource.ts file
- Keeps configuration organized
- Easy to find and modify
- Imported into backend.ts

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@aws-amplify/backend'"
**Solution**: 
```bash
npm install
```
Dependencies might not have installed properly.

### Issue: TypeScript errors in resource.ts
**Solution**: 
- Check for typos
- Make sure you copied the code exactly
- Verify the file is saved
- Try: `npm run build` again

### Issue: "auth is not defined" in backend.ts
**Solution**: 
- Make sure you imported auth: `import { auth } from './auth/resource';`
- Check the path is correct
- Verify resource.ts exports auth: `export const auth = ...`

### Issue: Folder not created
**Solution**: 
```bash
# Create it manually
mkdir -p amplify/auth
```

---

## 📝 Notes

- We haven't deployed anything yet - this is just configuration
- The actual Cognito User Pool will be created when we deploy (next steps)
- You can add more user attributes later if needed
- Password requirements are set to AWS defaults (min 8 chars, etc.)

---

## 🎯 What's Next?

In the next step (1.1.3), we'll:
- Create the `amplify/storage/resource.ts` file
- Configure S3 for storing asset images
- Set up access permissions

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.1.2! 🎉

**You now have:**
- ✅ Cognito authentication configured
- ✅ Email/password login enabled
- ✅ User attributes defined (email auto-included, preferredUsername optional)
- ✅ Auth integrated into backend

---

## 📸 Expected Final State

Your directory structure should look like:
```
asset-management-app/
├── amplify/
│   ├── auth/
│   │   └── resource.ts        # ← NEW! Auth configuration
│   ├── data/
│   │   └── resource.ts        # (might exist)
│   ├── backend.ts             # ← UPDATED! Imports auth
│   └── package.json
├── node_modules/
├── package.json
├── package-lock.json
├── tsconfig.json
└── .gitignore
```

---

## 🔗 Additional Resources

- [Amplify Auth Documentation](https://docs.amplify.aws/gen2/build-a-backend/auth/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [User Attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)

---

**Ready for Step 1.1.3?** Let me know when you've completed this step and verified everything! 🚀
