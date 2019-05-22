import {Pact} from '@pact-foundation/pact';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {newProvider} from './ProviderFactory';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
