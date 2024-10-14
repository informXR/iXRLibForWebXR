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

# Function to get the latest published version
get_latest_version() {
    local package_name="$1"
    npm view "$package_name" version 2>/dev/null || echo "0.0.0"
}

# Find the correct package.json file (not in node_modules)
PACKAGE_JSON_PATH=$(find /opt/informxr -maxdepth 2 -name package.json | grep -v "node_modules" | head -n 1)

if [ -z "$PACKAGE_JSON_PATH" ]; then
    echo "Error: package.json not found"
    exit 1
fi

# Get the directory containing package.json
PACKAGE_DIR=$(dirname "$PACKAGE_JSON_PATH")

# Change to the directory containing package.json
cd "$PACKAGE_DIR"

# Get the package name from package.json
PACKAGE_NAME=$(node -p "require('./package.json').name")

# Verify the package name
if [ "$PACKAGE_NAME" != "ixrlibforwebxr" ]; then
    echo "Error: Expected package name 'ixrlibforwebxr', but found '$PACKAGE_NAME'"
    echo "Please correct the package name in package.json"
    exit 1
fi

# Get the latest published version
LATEST_VERSION=$(get_latest_version "$PACKAGE_NAME")

# Parse the version components
IFS='.' read -r major minor patch <<< "$LATEST_VERSION"

# Increment the patch version
new_patch=$((patch + 1))

# Construct the new version
NEW_VERSION="${major}.${minor}.${new_patch}"

echo "New version will be: $NEW_VERSION"

# Clean up previous build
echo "Cleaning up previous build..."
rm -rf build ixrlibforwebxr

# Run TypeScript compiler and copy files
echo "Compiling TypeScript and copying files..."
npm run build

# Create a new directory for the package
echo "Creating package directory..."
mkdir -p ixrlibforwebxr

# Copy necessary files to the package directory
echo "Copying package files..."
cp -R build/src/* ixrlibforwebxr/
cp package.json README.md LICENSE ixrlibforwebxr/

# Ensure the network folder is copied
if [ -d "build/src/network" ]; then
    echo "Copying network folder..."
    cp -R build/src/network ixrlibforwebxr/
else
    echo "Warning: network folder not found in build/src/"
fi

# Update package.json in the new directory
echo "Updating package.json for distribution..."
node -e "
    const pkg = require('./ixrlibforwebxr/package.json');
    delete pkg.devDependencies;
    delete pkg.scripts;
    pkg.main = 'iXR.js';
    pkg.types = 'iXR.d.ts';
    pkg.files = ['iXR.js', 'iXR.d.ts', 'network/**/*', 'README.md', 'LICENSE'];
    require('fs').writeFileSync('./ixrlibforwebxr/package.json', JSON.stringify(pkg, null, 2));
"

# Check for NPM_TOKEN environment variable
if [ -z "$NPM_TOKEN" ]; then
    echo "Error: NPM_TOKEN environment variable is not set."
    echo "Please set it with your npm access token before running this script."
    exit 1
fi

# Use token-based authentication
echo "Using npm access token for authentication..."
npm config set //registry.npmjs.org/:_authToken="${NPM_TOKEN}"

# Navigate to package directory
cd ixrlibforwebxr

# Create a tarball of the package
echo "Creating package tarball..."
npm pack

# Get the name of the created tarball
TARBALL_NAME=$(ls *.tgz)

# Publish the package
echo "Publishing version $NEW_VERSION to npm..."
npm publish $TARBALL_NAME --access public

# Clean up - remove the token from npm config
npm config delete //registry.npmjs.org/:_authToken

# Return to original directory
cd ..

echo "Package published successfully!"
