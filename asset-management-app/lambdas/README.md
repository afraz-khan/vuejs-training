# Lambda Functions Build Guide

## Overview
This directory contains Lambda functions for the Asset Management application. The functions are written in TypeScript and need to be compiled/bundled before deployment.

## Build Process

### Using esbuild (Recommended)
The recommended way to build Lambda functions is using esbuild, which bundles all code including shared dependencies into a single JavaScript file.

```bash
./build-lambdas-bundle.sh
```

This will:
- Bundle each Lambda function with esbuild
- Include all shared code in the bundle
- Output to `dist/index.js` in each function directory
- External dependencies (sequelize, mysql2, @aws-sdk/*) are not bundled and will be loaded from node_modules at runtime

### Using TypeScript Compiler (Legacy)
You can also use the TypeScript compiler, but this creates a more complex directory structure:

```bash
./build-lambdas.sh
```

## Lambda Functions

1. **createAsset** - Creates a new asset in the database
2. **getAsset** - Retrieves a single asset by ID
3. **listAssets** - Lists assets with pagination and filtering
4. **updateAsset** - Updates an existing asset
5. **deleteAsset** - Deletes an asset
6. **syncSchema** - One-time function to sync database schema

## Deployment

After building, deploy with Amplify:

```bash
cd ../
npx ampx sandbox
```

## Handler Configuration

All Lambda functions use the handler path: `dist/index.handler`

This is configured in `amplify/backend.ts`.

## Shared Code

Shared code is located in `lambdas/shared/src/` and includes:
- Database models (Sequelize)
- Database connection helpers
- Utility functions (response formatting, etc.)
- Type definitions

## Dependencies

Each Lambda function has its own `node_modules` with the required dependencies. The shared folder also has its own `node_modules` that contains common dependencies.

## Troubleshooting

### "Cannot find module 'index'" Error
This means the Lambda function wasn't built properly. Run the build script:
```bash
./build-lambdas-bundle.sh
```

### Import Errors
Make sure all dependencies are installed:
```bash
cd shared && npm install
cd ../functions/listAssets && npm install
# Repeat for other functions
```
