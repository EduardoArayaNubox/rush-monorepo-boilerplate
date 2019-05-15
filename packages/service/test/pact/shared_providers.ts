import {Pact} from '@pact-foundation/pact';
import {newProvider} from './ProviderFactory';

const packageName = 'template-service';

const providers: Pact[] = [
];

before(async function() {
	await Promise.all(providers.map((provider) => provider.setup()));
});

after(async function() {
	await Promise.all(providers.map((provider) => provider.finalize()));
});

export {
};
