const pact = require('@pact-foundation/pact-node');
const package = require(`${process.env.PWD}/package.json`);

(async () => {
	await pact.publishPacts({
		pactFilesOrDirs: ['./pacts'],
		consumerVersion: package.version,
		pactBroker: 'https://pact-broker.6river.tech/',
		pactBrokerUsername: process.env.PACT_BROKER_USERNAME || '',
		pactBrokerPassword: process.env.PACT_BROKER_PASSWORD || '',
	});
})();
