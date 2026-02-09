#!/bin/bash

# Copy shared code to each function
FUNCTIONS=("createAsset" "getAsset" "listAssets" "updateAsset" "deleteAsset" "syncSchema")

for func in "${FUNCTIONS[@]}"; do
  echo "Preparing $func..."
  mkdir -p "functions/$func/shared"
  cp -r shared/src "functions/$func/shared/"
  cp -r shared/node_modules "functions/$func/" 2>/dev/null || true
done

echo "All functions prepared for deployment!"
