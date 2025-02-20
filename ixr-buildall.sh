#!/usr/bin/bash

echo "building js files..."
npm run build
echo "\n\nwebpacking js files...\n\n"
npx webpack
