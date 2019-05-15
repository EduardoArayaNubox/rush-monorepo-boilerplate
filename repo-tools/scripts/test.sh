#!/bin/bash

## TODO: Port to TS

BASENAME=$(basename $PWD)

export PUBSUB_EMULATOR_HOST=${PUBSUB_EMULATOR:-localhost:8802}
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

# don't re-run lint when running pact tests
if [ "$NODE_ENV" = "test" ]; then
  echo "Linting ${BASENAME}..."
  ./node_modules/.bin/eslint --ext .ts,.js ${ESLINT_OPTS} .
  retVal=$?
  if [ $retVal -ne 0 ]; then
    echo "Linter Error"
    exit $retVal
  fi
fi

# don't wipe out pre-existing coverage files if running acceptance (pact) tests
if [ "$NODE_ENV" != "test" ]; then
  NYC_OPTS="${NYC_OPTS} --clean=false"
fi

echo "Testing ${BASENAME}..."
./node_modules/.bin/nyc ${NYC_OPTS} ./node_modules/.bin/mocha ${MOCHA_OPTS} $@
retVal=$?
if [ $retVal -ne 0 ]; then
    echo "Test Error"
    exit $retVal
fi
