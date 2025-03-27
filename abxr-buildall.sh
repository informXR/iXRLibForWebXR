#!/usr/bin/bash

echo "building js files..."
npm run build
if [ $? -ne 0 ]; then
	echo "An error occurred while running build."
	# Handle the error, e.g., log it, take alternative action, or exit
	# exit 1
fi
echo "\n\nwebpacking js files...\n\n"
npx webpack
if [ $? -ne 0 ]; then
	echo "An error occurred while running webpack."
	# Handle the error, e.g., log it, take alternative action, or exit
	# exit 1
fi
