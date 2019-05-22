#!/bin/bash

set -euo pipefail
set -x

# this is separate from prep just to get better timing information out of CI

# Ignore this big directory because we don't need it for the next step
echo "common/temp" >> .dockerignore

docker build -t rush_cache -f rush_cache_2.dockerfile .
