#!/bin/bash

set -euo pipefail
set -x

shasum="$(cat common/config/rush/pnpm-lock.yaml rush_cache_1.dockerfile | sha1sum | cut -d' ' -f1)"

# TODO: is it faster to pull this image from gcr.io, or to use docker save/load
# TODO: all we actually care about is if the image exists, but that's hard to find out without pulling
if ! docker pull "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" ; then
  echo "rush_cache_1 was lost from prior step?!" 1>&2
	exit 1
else
  echo "tagging rush_cache docker tag gcr.io/plasma-column-128721/rush_cache_1_$shasum rush_cache"
  docker tag "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" rush_cache_1
fi
