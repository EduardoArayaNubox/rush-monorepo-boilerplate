const pact = require('@pact-foundation/pact-node');
const path = require('path');

const config = require('./server-defaults');

const pactProvider = 'template-service';

const pactClients = [
	// List pact clients here (strings must match pact-broker)
	'asset-manager',
];

describe(pactProvider, function() {
	pactClients.forEach((pactClient) => {
		it(`verify pacts againt ${pactClient}`, async function() {
			const opts = {
				// where your service will be running during the test, either staging or localhost on CI
				providerBaseUrl: `http://localhost:${config.providerPort}`,
				// the POST url to call to set up states (does nothing)
				// providerStatesSetupUrl: `http://localhost:${config.providerPort}/v1`,
				// the pacts to test against
				pactUrls: [`${config.pactBrokerHost}/pacts/provider/${pactProvider}/consumer/${pactClient}/latest`],
				publishVerificationResult: true,
				providerVersion: '1.0.0', // TODO - make dynamic, keep in sync
			};
			await pact.verifyPacts(opts);
		});
	});
});
