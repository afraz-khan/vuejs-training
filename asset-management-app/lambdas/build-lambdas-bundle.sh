#!/bin/bash

# Build script to bundle TypeScript Lambda functions to JavaScript using esbuild

echo "🔨 Building Lambda functions with esbuild..."

FUNCTIONS=("createAsset" "getAsset" "listAssets" "updateAsset" "deleteAsset" "syncSchema")

for func in "${FUNCTIONS[@]}"; do
  echo "📦 Building $func..."
  cd "functions/$func"
  
  # Bundle using esbuild
  ../../shared/node_modules/.bin/esbuild index.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=cjs \
    --outfile=dist/index.js \
    --external:@aws-sdk/* \
    --external:aws-sdk \
    --external:sequelize \
    --external:mysql2 \
    --external:pg-hstore
  
  if [ $? -eq 0 ]; then
    echo "  ✅ $func bundled successfully"
  else
    echo "  ❌ $func bundling failed"
    exit 1
  fi
  
  cd ../..
done

echo ""
echo "✨ All Lambda functions built successfully!"
echo ""
echo "Next step: Deploy with 'npx ampx sandbox' from the asset-management-app directory"
