#!/bin/bash

## TODO: Port to TS

BASENAME=$(basename $PWD)

if [ ${CI} ]; then
  export MOCHA_OPTS=--reporter mocha-junit-reporter
  export MOCHA_FILE=./reports/junit/${BASENAME}/mocha.xml
  export ESLINT_OPTS=--quiet --format junit -o ./reports/junit/${BASENAME}/eslint.xml
fi

export NODE_ENV=test

./node_modules/.bin/eslint --ext .ts,.js ${ESLINT_OPTS} .
./node_modules/.bin/nyc mocha ${MOCHA_OPTS} $@
