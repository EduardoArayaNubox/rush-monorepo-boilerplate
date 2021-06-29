#!/usr/bin/env bash

DO_IT=${1:-false}

# Get the root path of the repo
ROOT=$(git rev-parse --show-toplevel)

# Get the version from package.json
PACKAGE_VERSION=$(cat ${ROOT}/packages/*/package.json \
  | grep @sixriver/standard-api \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

# Find the yaml files in packages/oas tht are committed to git
YAML_FILES=$(git ls-files --full-name "${ROOT}/packages/oas/*.yaml" "${ROOT}/packages/oas/**/*.yaml")

# Now do the replacement in-place (MacOS/Unix compatible) https://frontend-apps.6river.org/api/v${PACKAGE_VERSION}
for FILE in ${YAML_FILES} ; do
  # If the yaml file imports from standard api, update the version
  if grep -q "https://frontend-apps.6river.org/api/v" "${ROOT}/${FILE}" ; then
    if [[ ${DO_IT} = true ]] ; then
      sed -i.bak -e "s#\(https://frontend-apps.6river.org/api/v\)[^/]*/#https://frontend-apps.6river.org/api/v${PACKAGE_VERSION}/#g" "${ROOT}/${FILE}"
      rm "${ROOT}/${FILE}.bak"
    else
      diff "${ROOT}/${FILE}" <( sed -e "s#\(https://frontend-apps.6river.org/api/v\)[^/]*/#https://frontend-apps.6river.org/api/v${PACKAGE_VERSION}/#g" "${ROOT}/${FILE}" )
    fi
  fi
done
