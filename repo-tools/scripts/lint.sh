#!/bin/bash

## TODO: Port to TS

BASENAME=$(basename $PWD)

if [ ${CI} ]; then
  REPORTDIR=/home/circleci/project/reports/junit/${BASENAME}
  echo Creating ${REPORTDIR}
  mkdir -p ${REPORTDIR}
  export ESLINT_OPTS="--format junit -o ${REPORTDIR}/eslint.xml"
fi

for lintCheck in $(./node_modules/.bin/eslint --ext .ts,.js ${ESLINT_OPTS} .) $(./node_modules/.bin/pretty-quick --pattern "**/*.*(js|ts)" --check .);
do
	echo "Linting ${BASENAME}..."
	retVal=$?
	if [ $retVal -ne 0 ]; then
		echo "Linter Error"
		exit $retVal
	fi
done
