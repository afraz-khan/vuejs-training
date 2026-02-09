#!/bin/bash

# Build script to compile TypeScript Lambda functions to JavaScript

echo "🔨 Building Lambda functions..."

FUNCTIONS=("createAsset" "getAsset" "listAssets" "updateAsset" "deleteAsset" "syncSchema")

for func in "${FUNCTIONS[@]}"; do
  echo "📦 Building $func..."
  cd "functions/$func"
  
  # Compile TypeScript to JavaScript using shared tsc
  ../../shared/node_modules/.bin/tsc
  
  if [ $? -eq 0 ]; then
    echo "  ✅ $func compiled successfully"
  else
    echo "  ❌ $func compilation failed"
    exit 1
  fi
  
  cd ../..
done

echo ""
echo "✨ All Lambda functions built successfully!"
echo ""
echo "Next step: Deploy with 'npx ampx sandbox' from the asset-management-app directory"
