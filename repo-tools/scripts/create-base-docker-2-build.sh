#!/bin/bash

# this is separate from prep just to get better timing information out of CI

docker build -t rush_cache -f rush_cache_2.dockerfile .
