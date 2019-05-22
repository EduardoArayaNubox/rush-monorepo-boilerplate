#!/bin/bash

set -euo pipefail
set -x

shasum="$(cat common/config/rush/pnpm-lock.yaml rush_cache_1.dockerfile | sha1sum | cut -d' ' -f1)"

if ! docker pull "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" ; then
  docker build -t rush_cache_1 -f rush_cache_1.dockerfile .
  docker tag rush_cache_1 "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}"
  docker push "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}"
else
  echo "tagging rush_cache docker tag gcr.io/plasma-column-128721/rush_cache_1_$shasum rush_cache"
  docker tag "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" rush_cache_1
fi
