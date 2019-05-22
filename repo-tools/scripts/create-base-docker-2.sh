#!/bin/bash

ci_scripts/ci_tool.sh --docker_login

#Ignore this big directory because we don't need it for the next step
echo "common/temp/node_modules" >> .dockerignore

docker build -t rush_cache -f rush_cache_2.dockerfile .
