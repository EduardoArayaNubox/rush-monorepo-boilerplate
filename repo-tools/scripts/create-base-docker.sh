#!/bin/bash
cat common/config/rush/shrinkwrap.yaml > /tmp/cache_check.txt
cat rush_cache_1.dockerfile >> /tmp/cache_check.txt

shasum="$(shasum /tmp/cache_check.txt | awk '{print $1}')"

ci_scripts/ci_tool.sh --docker_login

docker pull "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}"

if [[ $? -gt 0 ]]; then
  docker build -t rush_cache_1 -f rush_cache_1.dockerfile .
  docker tag rush_cache_1 "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}"
  docker push "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}"
else
  echo "tagging rush_cache docker tag gcr.io/plasma-column-128721/rush_cache_1_$shasum rush_cache"
  docker tag "gcr.io/plasma-column-128721/${CIRCLE_PROJECT_REPONAME}_rush_cache_1_${shasum}" rush_cache_1
fi

#Ignore this big directory because we don't need it for the next step
echo "common/temp/node_modules" >> .dockerignore

docker build -t rush_cache -f rush_cache_2.dockerfile .
