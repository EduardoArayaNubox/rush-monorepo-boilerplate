#!/bin/bash

## Get SEMREL_VERSION
source ~/project/ci_scripts/ci_tool.sh

run_release

export VERSION=$(cat .version)

git config --global user.name "6RS"
git config --global user.email "noreply@6river.com"

node common/scripts/install-run-rush.js version --ensure-version-policy --version-policy prerelease --override-version ${VERSION}
