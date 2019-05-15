#!/bin/bash

PACKAGES=$(find $(pwd -P) -name package.json -type f -not -path "*/node_modules/*" -not -path "*/rush-recycler/*")

for p in $PACKAGES; do
	# TODO: What do we need to do here?
	true
done
