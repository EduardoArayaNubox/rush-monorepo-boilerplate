#!/bin/bash

set -euo pipefail
set -x

# Ignore this big directory because we don't need it for the next step
echo "common/temp" >> .dockerignore

docker build -t rush_cache -f rush_cache_2.dockerfile .
# get the full id of the just-built image to ues as a tag
imageid=$(docker images -q --no-trunc rush_cache | cut -d: -f2)
# make sure we got something plausibly long
test "${#imageid}" -gt 10
docker tag rush_cache "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_2_${imageid}"
docker push "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_2_${imageid}"
# save it for the next step to read out to now what to base off
echo -n "$imageid" > rush_cache_2.rev
