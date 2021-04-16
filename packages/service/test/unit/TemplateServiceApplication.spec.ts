import { Provider } from '@loopback/context';
import { ServiceConfig, ServiceConfigBindings } from '@sixriver/loopback4-support';
import { assert } from 'chai';

import { TemplateServiceApplication } from '../../src';

abstract class MockProvider<T> implements Provider<T> {
	constructor(private readonly value_: T) {}
	value(): T {
		return this.value_;
	}
}

describe(TemplateServiceApplication.name, function () {
	let app: TemplateServiceApplication;

	context('constructor args', function () {
		it('should use a provided serviceconfig provider', async function () {
			const fauxServiceConfig = {} as ServiceConfig;
			class MockSCP extends MockProvider<ServiceConfig> {
				constructor() {
					super(fauxServiceConfig);
				}
			}
			app = new TemplateServiceApplication({ serviceConfig: MockSCP });
			const value = await app.get<ServiceConfig>(ServiceConfigBindings.SERVICE_CONFIGURATION);
			assert.strictEqual(value, fauxServiceConfig);
		});
	});
});
