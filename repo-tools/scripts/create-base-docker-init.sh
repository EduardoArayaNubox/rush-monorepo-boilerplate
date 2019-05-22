#!/bin/bash
cat common/config/rush/pnpm-lock.yaml > /tmp/cache_check.txt
cat rush_cache_1.dockerfile >> /tmp/cache_check.txt

shasum="$(shasum /tmp/cache_check.txt | awk '{print $1}')"

ci_scripts/ci_tool.sh --docker_login
