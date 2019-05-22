import {Pact} from '@pact-foundation/pact';
const path = require('path');

export function newProvider(consumer: string, provider: string, port: number): Pact {
	return new Pact({
		consumer,
		port,
		provider,
		log: path.resolve(process.cwd(), 'logs', `${provider}-mockserver-integration.log`),
		dir: path.resolve(process.cwd(), 'pacts'),
		spec: 2,
		pactfileWriteMode: 'merge',
	});
};
