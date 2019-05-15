import {assert} from 'chai';

import * as uuidv4 from 'uuid/v4';
import {Provider} from '@loopback/context';

import {
	ServiceConfig,
	ServiceConfigBindings,
} from '@sixriver/wis-common';

import {TemplateServiceApplication} from '../../src';

abstract class MockProvider<T> implements Provider<T> {
	constructor(private readonly value_: T) {}
	value(): T {
		return this.value_;
	}
}

describe(TemplateServiceApplication.name, function() {
	let app: TemplateServiceApplication;

	context('constructor args', function() {
		it('should use a provided serviceconfig provider', async function() {
			const fauxServiceConfig = {} as ServiceConfig;
			class MockSCP extends MockProvider<ServiceConfig> {
				constructor() {
					super(fauxServiceConfig);
				}
			}
			app = new TemplateServiceApplication({serviceConfig: MockSCP});
			const value = await app.get<ServiceConfig>(ServiceConfigBindings.SERVICE_CONFIGURATION);
			assert.strictEqual(value, fauxServiceConfig);
		});
	});

	context('getServiceConfigOptions', function() {
		it('production: should throw if SITE_NAME missing', function() {
			const env = {
				NODE_ENV: 'production',
			};
			assert.throws(() => TemplateServiceApplication.getServiceConfigOptions(env));
		});
		it('production: should return values if env is proper', function() {
			for (const grm of [undefined, 'https://foo.example']) {
				const env = {
					NODE_ENV: 'production',
					SITE_NAME: uuidv4(),
					GRM_URL: grm,
				};
				const result = TemplateServiceApplication.getServiceConfigOptions(env);
				assert.propertyVal(result, 'siteName', env.SITE_NAME);
				assert.property(result, 'grmUrl');
				if (env.GRM_URL) {
					assert.propertyVal(result, 'grmUrl', env.GRM_URL);
				}
			}
		});

		it('non-prod: should require SITE_NAME if USE_GRM is set', function() {
			const env = {
				NODE_ENV: 'test',
				USE_GRM: 'true',
			};
			assert.throws(() => TemplateServiceApplication.getServiceConfigOptions(env));
		});

		it('non-prod: should use GRM if told to', function() {
			for (const grm of [undefined, 'https://foo.example']) {
				const env = {
					NODE_ENV: 'test',
					SITE_NAME: uuidv4(),
					USE_GRM: 'true',
					GRM_URL: grm,
				};
				const result = TemplateServiceApplication.getServiceConfigOptions(env);
				assert.propertyVal(result, 'siteName', env.SITE_NAME);
				assert.property(result, 'grmUrl');
				if (env.GRM_URL) {
					assert.propertyVal(result, 'grmUrl', env.GRM_URL);
				}
			}
		});
	});
});
