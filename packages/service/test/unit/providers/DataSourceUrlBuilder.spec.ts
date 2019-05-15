import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';
import {assert} from 'chai';

import {AnyObject} from '@loopback/repository';

import {fillDataSourceConfig} from '../../../src/providers';

describe('DataSourceUrlBuilder', function() {
	context('fillDataSourceConfig', function() {
		let config: AnyObject;
		let defaultConfig: AnyObject;
		let env: NodeJS.ProcessEnv;

		beforeEach(function() {
			// this is intentionally silly: the logic shouldn't be parsing things
			// very closely, so replacing real values with uuids should be fine
			// except for certain specific tests
			defaultConfig = {
				name: uuidv4(),
				connector: uuidv4(),
				url: uuidv4(),
			};
			config = defaultConfig;
			env = {
				NODE_ENV: process.env.NODE_ENV || 'test',
			};
		});

		it('should return the input as is if it is custom', function() {
			config = _.cloneDeep(defaultConfig);
			const filled = fillDataSourceConfig(config, defaultConfig, env);
			assert.strictEqual(filled, config);
		});

		it('should return a copy if input is not custom', function() {
			assert.strictEqual(config, defaultConfig);
			const filled = fillDataSourceConfig(config, defaultConfig, env);
			assert.notStrictEqual(filled, config);
		});

		it('should use the memory connector in test', function() {
			env.NODE_ENV = 'test';
			const filled = fillDataSourceConfig(config, defaultConfig, env);
			assert.propertyVal(filled, 'connector', 'memory');
		});

		it('should use DATABASE_URL in non-test environments', function() {
			for (const nodeEnv of ['development', 'production']) {
				env.NODE_ENV = nodeEnv;
				env.DATABASE_URL = uuidv4();
				const filled = fillDataSourceConfig(config, defaultConfig, env);
				assert.propertyVal(filled, 'url', env.DATABASE_URL, nodeEnv);
			}
		});

		it('should compose url from pieces in production', function() {
			_.assign(env, {
				NODE_ENV: 'production',
				DATABASE_HOST: uuidv4(),
				DATABASE_USER: uuidv4(),
				DATABASE_PASS: uuidv4(),
				DATABASE_PORT: Math.round(Math.random() * 65535),
				DATABASE_NAME: uuidv4(),
			});
			const filled = fillDataSourceConfig(config, defaultConfig, env);
			assert.propertyVal(filled, 'url',
				`postgres://${env.DATABASE_USER}:${env.DATABASE_PASS}@${env.DATABASE_HOST}` +
				`:${env.DATABASE_PORT}/${env.DATABASE_NAME}`);

			// this part is a bit silly, just for coverage
			env.USER = '__user';
			for (const dropKey in env) {
				if (!dropKey.includes('DATABASE_')) {
					continue;
				}
				const env2: NodeJS.ProcessEnv = _.omit(env, dropKey);
				const filled = fillDataSourceConfig(config, defaultConfig, env2);
				assert.propertyVal(filled, 'url',
					`postgres://${env2.DATABASE_USER || env.USER}:${env2.DATABASE_PASS || ''}` +
					`@${env2.DATABASE_HOST || 'localhost'}:${env2.DATABASE_PORT || 5432}/` +
					`${env2.DATABASE_NAME || 'wis_container_split_' + env.NODE_ENV}`);
			}
		});
	});
});
