#!/bin/bash

## TODO: Port to TS

BASENAME=$(basename $PWD)

export PUBSUB_EMULATOR_HOST=${PUBSUB_EMULATOR_HOST:-localhost:8802}
export SITE_NAME=${SITE_NAME:-${USER:-chuckulator}}
export NODE_ENV=${NODE_ENV:-test}
export PUBSUB_GCLOUD_PROJECT=${SITE_NAME:-${NODE_ENV}}

NYC_OPTS=${NYC_OPTS:-}

if [ ${CI} ]; then
  REPORTDIR=/home/circleci/project/reports/junit/${BASENAME}
  echo Creating ${REPORTDIR}
  mkdir -p ${REPORTDIR}
  export MOCHA_OPTS="--reporter mocha-junit-reporter --reporter-options mochaFile=${REPORTDIR}/mocha-${NODE_ENV}.xml"
  export ESLINT_OPTS="--quiet --format junit -o ${REPORTDIR}/eslint.xml"
fi

# lint is now its own step, don't run it during unit tests

# don't wipe out pre-existing coverage files if running acceptance tests
if [ "$NODE_ENV" != "test" ]; then
  NYC_OPTS="${NYC_OPTS} --clean=false"
fi

# be strict about unhandled rejections
NODE_OPTIONS="$NODE_OPTIONS --unhandled-rejections=strict"
# but disable deprecation warnings until axios gets fixed
# https://github.com/axios/axios/issues/2469
NODE_OPTIONS="$NODE_OPTIONS --no-deprecation"
export NODE_OPTIONS

echo "Testing ${BASENAME}..."
./node_modules/.bin/nyc ${NYC_OPTS} ./node_modules/.bin/mocha ${MOCHA_OPTS} $@
retVal=$?
if [ $retVal -ne 0 ]; then
    echo "Test Error"
    exit $retVal
fi
