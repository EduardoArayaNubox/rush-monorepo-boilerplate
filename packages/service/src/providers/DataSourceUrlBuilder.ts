import * as _ from 'lodash';
import {AnyObject} from '@loopback/repository';

// FIXME: share this code with Container Split

export function fillDataSourceConfig(
	dsConfig: AnyObject,
	defaultConfig: AnyObject,
	env: NodeJS.ProcessEnv,
): AnyObject {
	// if the config was an explicitly provided value, use it as is
	if (dsConfig !== defaultConfig) {
		return dsConfig;
	}
	// treat the input as immutable: copy it before making changes
	dsConfig = _.cloneDeep(dsConfig);
	// following logic is based on the datasource setup for northbound
	let environment = env.NODE_ENV || 'development';
	let envUrl = env.DATABASE_URL;
	if (!envUrl && environment === 'production') {
		// only do URL composition in production mode, where we are _ignoring_ the
		// url from the JSON.  For other environments, we only look at DATABASE_URL
		const host = env.DATABASE_HOST || 'localhost';
		const user = env.DATABASE_USER || env.USER;
		const pass = env.DATABASE_PASS || '';
		const port = env.DATABASE_PORT || 5432;
		const name = env.DATABASE_NAME || 'template_service_' + environment;
		envUrl = `postgres://${user}:${pass}@${host}:${port}/${name}`;
	}
	// use the test database for acceptance tests too
	let testMode = env.TEST_MODE;
	if (environment === 'acceptance') {
		environment = 'test';
		testMode = 'acceptance';
	}
	switch (environment) {
	case 'production':
		dsConfig.url = envUrl;
		break;
	case 'test':
		// NOTE: most things won't use the URL because of the memory connector
		// but the one weird trick this allows is verifying the migrations in test
		dsConfig.url = envUrl || `${dsConfig.url}_${environment}`;
		// add TEST_MODE: 'acceptance' to force tests to use psql's test db
		// instead of memory connector
		if (env.TEST_MODE !== 'acceptance') {
			dsConfig.connector = 'memory';
		} else {
			// try to make the tests exit quickly by having the pool clear old connections faster than normal
			// note: this doesn't exactly work
			dsConfig.idleTimeoutMillis = 1000;
		}
		break;
	case 'development':
	default:
		dsConfig.url = envUrl || `${dsConfig.url}_${environment}`;
		break;
	}
	return dsConfig;
}
