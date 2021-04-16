#!/bin/bash

BASENAME=$(basename $PWD)

if [ ${CI} ]; then
  REPORTDIR=/home/circleci/project/reports/junit/${BASENAME}
  echo Creating ${REPORTDIR}
  mkdir -p ${REPORTDIR}
  export ESLINT_OPTS="--format junit -o ${REPORTDIR}/eslint.xml"
fi

echo "Linting ${BASENAME}..."
./node_modules/.bin/eslint --ext .ts,.js ${ESLINT_OPTS} .
lintret=$?

# TODO: running prettier should probably be a separate step from the main linter
echo "Checking format of ${BASENAME}..."
# dist, package.json, and some similar files are excluded by .prettierignore
./node_modules/.bin/prettier --check ${PRETTIER_OPTS} '**/*.{js,ts,md,json,yml,yaml,css,scss,less,graphql,mdx,jsx,tsx}'
formatret=$?

ret=0
if [ $lintret -ne 0 ]; then
	echo "Linter error" 1>&2
	ret=1
fi
if [ $formatret -ne 0 ]; then
	echo "Formatting error" 1>&2
	ret=1
fi
exit $ret
