#!/bin/bash

PACKAGES=$(find $(pwd -P) -name package.json -type f -not -path "*/node_modules/*" -not -path "*/rush-recycler/*")

for p in $PACKAGES; do
	COVERAGE=$(fgrep '"coverage":' $p)
	if [ -z "$COVERAGE" ]; then
		echo "Skipping coverage - no command found"
	else
		echo "Running coverage"
		PACKAGE_DIR=$(dirname "${p}")
		cd $PACKAGE_DIR || exit 1
		npm run coverage
	fi
done
