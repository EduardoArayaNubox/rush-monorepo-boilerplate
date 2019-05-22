#!/bin/bash

set -euo pipefail
set -x

# get the full id of the just-built image to ues as a tag
test -f "rush_cache_2.rev"
imageid=$(<rush_cache_2.rev)
# make sure we got something plausibly long
test "${#imageid}" -gt 10
docker pull "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_2_${imageid}"
docker tag "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_2_${imageid}" rush_cache
