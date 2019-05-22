#!/bin/bash

set -euo pipefail
set -x

shasum="$(cat common/config/rush/pnpm-lock.yaml rush_cache_1.dockerfile | sha1sum | cut -d' ' -f1)"
# have to put the flag file in a constantly named directory so that circle caching can pick it up
flagdir="rush_cache_1.built"
flagfile="${flagdir}/rush_cache_1_${shasum}.built"

if [ -f "${flagfile}" ]; then
	echo "Found flag file, assuming rush_cache_1 is already built for ${sha1sum}"
elif ! docker pull "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" ; then
	# still needed to do the pull check in case cache was built before flag file caching was added
  docker build -t rush_cache_1 -f rush_cache_1.dockerfile .
  docker tag rush_cache_1 "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}"
  docker push "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}"
else
  echo "tagging rush_cache docker tag gcr.io/plasma-column-128721/rush_cache_1_$shasum rush_cache"
  docker tag "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" rush_cache_1
fi

mkdir -p "$flagdir"
touch "$flagfile"
