import * as _ from 'lodash';

// we need these set to run outside the `repo-tools/scripts/test.sh` wrapper
_.defaults(process.env, {
	NODE_ENV: 'test',
	PUBSUB_EMULATOR_HOST: 'localhost:8802',
	PUBSUB_GCLOUD_PROJECT: 'chuckulator',
	SITE_NAME: 'test',
});

// uncomment this for debugging
/*
const winr = require('why-is-node-running');

after(function() {
	setTimeout(() => {
		winr();
	}, 1250).unref();
});
/**/
