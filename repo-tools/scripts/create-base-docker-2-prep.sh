#!/bin/bash

# TODO: is it faster to pull this image from gcr.io, or to use docker save/load
if ! docker pull "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" ; then
  echo "rush_cache_1 was lost from prior step?!" 1>&2
	exit 1
else
  echo "tagging rush_cache docker tag gcr.io/plasma-column-128721/rush_cache_1_$shasum rush_cache"
  docker tag "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" rush_cache_1
fi
