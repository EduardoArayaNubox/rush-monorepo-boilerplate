#!/bin/bash

# usage: $0 <logs-dir> <command>
# will run command, collect packages/*/*.log into <logs-dir>,
# APPENDING for any existing files,
# and then pass the exit code of the command on pout

if [ $# -lt 2 ]; then
	echo "Usage: $0 <log-dir> <command>" 1>&2
	exit 1
fi

logdir="$1"
shift

"$@"
rc=$?

mkdir -p "$logdir"

cat rush.json \
| npx jsmin \
| jq -r '.projects[].projectFolder' \
| while read packageFolder ; do
	for f in "$packageFolder"/*.log ; do
		[ -f "$f" ] || continue
		bf="$(basename "$f")"
		# rush overwrites its log files, so we need to append them to capture everything
		cat "$f" >> "${logdir}/${bf}"
		# delete the captured logfile so we don't duplicate material in subsequent runs
		rm -f "$f"
	done
done

if [ $rc != 0 ]; then
	echo "Build step failed: $*" 1>&2
	echo "Detailed logs can be found in the CircleCI Artifacts tab" 1>&2
fi

exit $rc
