#!/bin/bash

# Deployment Preparation Script
# Copies shared code to each Lambda function for deployment

echo "🚀 Preparing Lambda functions for deployment..."

# Array of function names
FUNCTIONS=("createAsset" "getAsset" "listAssets" "updateAsset" "deleteAsset" "syncSchema")

# Copy shared code to each function
for func in "${FUNCTIONS[@]}"; do
  echo "📦 Preparing $func..."
  
  # Create shared directory in function
  mkdir -p "functions/$func/shared"
  
  # Copy shared source code
  cp -r shared/src "functions/$func/shared/"
  
  # Copy node_modules if they exist
  if [ -d "shared/node_modules" ]; then
    echo "  📚 Copying node_modules..."
    cp -r shared/node_modules "functions/$func/" 2>/dev/null || true
  fi
  
  # Copy package.json for dependencies
  if [ -f "shared/package.json" ]; then
    cp shared/package.json "functions/$func/shared/"
  fi
  
  echo "  ✅ $func prepared"
done

echo ""
echo "✨ All functions prepared for deployment!"
echo ""
echo "Next steps:"
echo "1. cd .. (back to asset-management-app root)"
echo "2. npx ampx sandbox"
