#!/bin/bash

# Fix UUID version in all Lambda functions
# Removes uuid v11 (ESM) and installs uuid v9 (CommonJS compatible)

echo "🔧 Fixing UUID version in Lambda functions..."

FUNCTIONS=("createAsset" "getAsset" "listAssets" "updateAsset" "deleteAsset" "syncSchema")

for func in "${FUNCTIONS[@]}"; do
  echo "📦 Fixing $func..."
  
  # Remove uuid from node_modules if it exists
  if [ -d "functions/$func/node_modules/uuid" ]; then
    rm -rf "functions/$func/node_modules/uuid"
  fi
  
  # Install uuid v9
  npm install uuid@9.0.1 --prefix "functions/$func" --no-save
  
  if [ $? -eq 0 ]; then
    echo "  ✅ $func fixed"
  else
    echo "  ❌ $func failed"
    exit 1
  fi
done

echo ""
echo "✨ All Lambda functions fixed!"
echo ""
echo "Next step: Rebuild with './build-lambdas.sh'"
