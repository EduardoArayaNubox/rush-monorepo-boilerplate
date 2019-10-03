const fs = require('fs');
const pact = require('@pact-foundation/pact-node');
const package = require(`${process.env.PWD}/package.json`);

const pactsPath = './pacts';

// stderr output will fail the build, gracefully skip this if there are no pacts to publish
if (process.argv.some((arg) => arg == '--allow-empty')) {
	if (!fs.readdirSync(pactsPath).length) {
		console.log('No pacts found in dir');
		process.exit(0);
	}
}

(async () => {
	await pact.publishPacts({
		pactFilesOrDirs: ['./pacts'],
		consumerVersion: package.version,
		pactBroker: 'https://pact-broker.6river.tech/',
		pactBrokerUsername: process.env.PACT_BROKER_USERNAME || '',
		pactBrokerPassword: process.env.PACT_BROKER_PASSWORD || '',
	});
})();
