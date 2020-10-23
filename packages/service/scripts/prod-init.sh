#!/usr/bin/env bash

# This script is to be run as the init container in production,
# to allow lengthy database migrations to have a longer timeout than normal app startup

set -euo pipefail
set -x

exec node . --init-only
