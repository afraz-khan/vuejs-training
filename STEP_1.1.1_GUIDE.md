# Step 1.1.1: Initialize Amplify Gen 2 Project

## 🎯 Goal
Create a new AWS Amplify Gen 2 project that will serve as the backend for our asset management application.

## 📚 What You'll Learn
- How to initialize an Amplify Gen 2 project
- Understanding the Amplify project structure
- What files Amplify creates and why

## 📋 Prerequisites
Before starting, make sure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] AWS CLI configured (`aws configure list`)
- [ ] You're in the `vuejs-training` directory

## 🚀 Step-by-Step Instructions

### 1. Check Your Current Location
First, let's make sure you're in the right directory:

```bash
# You should be in vuejs-training folder
pwd
```

Expected output: `/Users/apple/.../vuejs-training`

---

### 2. Create the Amplify Project
Run this command to create a new Amplify Gen 2 project:

```bash
npm create amplify@latest
```

---

### 3. Answer the Prompts
The CLI will ask you several questions. Here's what to answer:

**Prompt 1**: "Where should we create your project?"
```
Answer: asset-management-app
```
(This creates a new folder called `asset-management-app`)

**Prompt 2**: "Would you like to initialize a new Amplify project?"
```
Answer: Yes (press Enter)
```

**Prompt 3**: The CLI will then:
- Create the project structure
- Install dependencies (this takes 1-2 minutes)
- Set up the initial configuration

---

### 4. Wait for Installation
You'll see output like:
```
Creating a new Amplify project in asset-management-app...
Installing packages. This might take a couple of minutes...
```

☕ **Take a break** - this will take 1-2 minutes.

---

### 5. Navigate to the Project
Once installation is complete, move into the new project:

```bash
cd asset-management-app
```

---

### 6. Explore the Project Structure
Let's see what Amplify created for us:

```bash
ls -la
```

You should see:
```
.
├── amplify/              # Backend configuration folder
│   ├── auth/            # (will create this next)
│   ├── data/            # (will create this next)
│   ├── storage/         # (will create this next)
│   └── backend.ts       # Main backend configuration
├── node_modules/        # Dependencies
├── package.json         # Project dependencies
├── package-lock.json    # Locked dependency versions
├── tsconfig.json        # TypeScript configuration
└── .gitignore          # Git ignore rules
```

---

### 7. Check the amplify Folder
Let's look inside the amplify folder:

```bash
ls -la amplify/
```

You should see:
```
amplify/
├── backend.ts          # Main backend entry point
└── package.json        # Amplify-specific dependencies
```

---

### 8. Open and Review backend.ts
Let's see what's in the main backend file:

```bash
cat amplify/backend.ts
```

You should see something like:
```typescript
import { defineBackend } from '@aws-amplify/backend';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  // We'll add auth, data, and storage here
});
```

This is where we'll configure all our AWS services!

---

### 9. Check package.json
Let's see what dependencies were installed:

```bash
cat package.json
```

Look for these key dependencies:
- `@aws-amplify/backend` - Core Amplify backend library
- `aws-cdk-lib` - AWS CDK for infrastructure
- `typescript` - TypeScript support

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `asset-management-app` folder created
- [ ] You're inside the `asset-management-app` folder (`pwd` shows it)
- [ ] `amplify` folder exists
- [ ] `amplify/backend.ts` file exists
- [ ] `node_modules` folder exists (dependencies installed)
- [ ] `package.json` has `@aws-amplify/backend` dependency
- [ ] No error messages during installation

---

## 🔍 Understanding What Happened

### What is Amplify Gen 2?
Amplify Gen 2 is AWS's latest framework for building full-stack applications. It uses:
- **TypeScript** for type-safe configuration
- **AWS CDK** under the hood for infrastructure
- **Code-first approach** - you define your backend in code, not JSON

### Project Structure Explained

**amplify/backend.ts**
- This is the main entry point for your backend
- You'll import and configure all AWS services here
- Think of it as the "brain" of your backend

**amplify/ folder**
- Contains all backend configuration
- We'll add subfolders for auth, data, storage, etc.
- Each service gets its own folder for organization

**package.json**
- Lists all dependencies
- Amplify Gen 2 uses npm packages for everything
- CDK is included for infrastructure as code

---

## 🎓 Key Concepts

1. **Infrastructure as Code (IaC)**
   - Your backend is defined in TypeScript files
   - Version controlled with Git
   - Reproducible across environments

2. **Type Safety**
   - TypeScript catches errors before deployment
   - Auto-completion in your IDE
   - Better developer experience

3. **Modular Architecture**
   - Each service (auth, data, storage) is separate
   - Easy to add/remove services
   - Clean organization

---

## 🐛 Troubleshooting

### Issue: "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org/

### Issue: "Permission denied"
**Solution**: Don't use `sudo`. If you have permission issues, fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Issue: Installation hangs
**Solution**: 
- Check your internet connection
- Try again with: `npm create amplify@latest --verbose`
- Clear npm cache: `npm cache clean --force`

### Issue: "amplify folder not created"
**Solution**: Make sure you answered "Yes" to initialize the project

---

## 📝 Notes

- The project uses TypeScript by default (don't worry, it's easy!)
- Amplify Gen 2 is different from Amplify Gen 1 (CLI-based)
- Everything is code-first, no JSON configuration files
- The backend will be deployed to your AWS account later

---

## 🎯 What's Next?

In the next step (1.1.2), we'll:
- Create the `amplify/auth/resource.ts` file
- Configure Cognito authentication
- Set up email/password login

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.1.1! 🎉

**You now have:**
- ✅ A new Amplify Gen 2 project
- ✅ Project structure in place
- ✅ Dependencies installed
- ✅ Ready to add authentication

---

## 📸 Expected Final State

Your directory structure should look like:
```
vuejs-training/
├── asset-management-app/     # ← NEW! You're here now
│   ├── amplify/
│   │   ├── backend.ts
│   │   └── package.json
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── .gitignore
├── movies-database-phase1/
├── movies-database-phase2/
├── ASSIGNMENT_DESIGN.md
└── IMPLEMENTATION_STEPS.md
```

---

**Ready for Step 1.1.2?** Let me know when you've completed this step and verified everything! 🚀
