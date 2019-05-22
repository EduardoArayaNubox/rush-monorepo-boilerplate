#!/bin/bash

set -euo pipefail
set -x

shasum="$(cat common/config/rush/pnpm-lock.yaml rush_cache_1.dockerfile | sha1sum | cut -d' ' -f1)"
# have to put the flag file in a constantly named directory so that circle caching can pick it up
flagdir="rush_cache_1.built"
flagfile="${flagdir}/rush_cache_1_${shasum}.built"

if [ -f "${flagfile}" ]; then
	echo "Found flag file, assuming rush_cache_1 is already built for ${shasum}"
	# Magick!  This will halt the containing job _without marking it as failed_
	circleci-agent step halt
fi
