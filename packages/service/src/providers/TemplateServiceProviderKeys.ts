import * as Ajv from 'ajv';

import {BindingKey} from '@loopback/context';

import {MinimalLogFactory, ServiceDirectory} from '@sixriver/cfs_models';
import {TemplateMessage} from '@sixriver/template-oas';

import {Validator} from '../components';

export namespace TemplateServiceProviderKeys {
	export const PROCESS_ENV = BindingKey.create<NodeJS.ProcessEnv>('process.env');

	// if you are using @sixriver/event-ingestor-lib, use this:
	// export const LOG_FACTORY: BindingKey<MinimalLogFactory> = EventBindingKeys.LOGFACTORY;
	export const LOG_FACTORY: BindingKey<MinimalLogFactory> = BindingKey.create<MinimalLogFactory>('minimal-log-factory');

	export const REQUEST_VALIDATOR = BindingKey.create<Validator<TemplateMessage, Ajv.ErrorObject>>(
		'template-message-validator');

	export const DB_MIGRATE_SCOPE = BindingKey.create<string>('template-service-db-migrate-scope');

	export const SERVICE_DIRECTORY = BindingKey.create<ServiceDirectory>('service-directory');
}
