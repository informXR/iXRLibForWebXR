#!/bin/bash

# iXR LIB PUBLISH SCRIPT
# Script to prepare and publish an npm package


# Exit immediately if a command exits with a non-zero status
set -e

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if necessary commands are available
if ! command_exists npm; then
    echo "Error: npm is not installed. Please install npm and try again."
    exit 1
fi

# Bump the version in the main package.json
echo "Bumping patch version..."
npm version patch --force

# Clean up previous build
echo "Cleaning up previous build..."
rm -rf build

# Run TypeScript compiler
echo "Compiling TypeScript..."
npm run build

# Copy necessary files to dist folder
echo "Copying package files..."

cd ..
# Create a new directory for the package
mkdir -p iXRLibForWebXR

# Print current directory for debugging
pwd

cp -R package.json README.md LICENSE build/ iXRLibForWebXR

# Remove development dependencies and scripts from package.json in dist
echo "Updating package.json for distribution..."
node -e "
    const pkg = require('./iXRLibForWebXR/package.json');
    delete pkg.devDependencies;
    delete pkg.scripts;
    pkg.main = 'src/iXR.js';
    pkg.types = 'test.js';
    require('fs').writeFileSync('./iXRLibForWebXR/package.json', JSON.stringify(pkg, null, 2));
"


# Check for NPM_TOKEN environment variable
if [ -z "$NPM_TOKEN" ]; then
    echo "Error: NPM_TOKEN environment variable is not set."
    echo "Please set it with your npm access token before running this script."
    exit 1
fi

# Remove the npm login check and replace with token-based authentication
echo "Using npm access token for authentication..."
npm config set //registry.npmjs.org/:_authToken="${NPM_TOKEN}"

# Navigate to build directory
cd iXRLibForWebXR

# Check for --no-publish parameter
if [[ "$*" == *"--no-publish"* ]]; then
    echo "Package prepared but not published. You can publish later using 'npm publish' in the iXRLibForWebXR directory."
else
    echo "Publishing to npm..."
    npm publish --access public
    if [ $? -eq 0 ]; then
        echo "Package published successfully!"
    else
        echo "Failed to publish package. Please check your npm access token and try again."
    fi
fi

# Clean up - remove the token from npm config
npm config delete //registry.npmjs.org/:_authToken

# Return to root directory
cd ..
echo "Package preparation complete!"
