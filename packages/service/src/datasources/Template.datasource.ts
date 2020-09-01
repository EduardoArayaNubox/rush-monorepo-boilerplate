import {inject} from '@loopback/core';
import {juggler, AnyObject} from '@loopback/repository';
import {CommonBindings, fillDataSourceConfig} from '@sixriver/loopback4-support';

const databaseBaseName = 'template_service';

const defaultConfig = {
	'connector': 'postgresql',
	'url': `postgres://6river:6river@localhost:5432/${databaseBaseName}`,
};

export class TemplateDataSource extends juggler.DataSource {
	constructor(
		@inject(CommonBindings.PROCESS_ENV)
			env: NodeJS.ProcessEnv,
			@inject('datasources.config.' + TemplateDataSource.name, {optional: true})
			dsConfig: AnyObject = defaultConfig,
	) {
		super(dsConfig = fillDataSourceConfig(dsConfig, defaultConfig, databaseBaseName, env));
	}

	/**
	 * Start the datasource when application is started
	 */
	async start(): Promise<void> {
		// nothing to do here
	}

	/**
	 * Disconnect the datasource when application is stopped. This allows the
	 * application to be shut down gracefully.
	 */
	async stop(): Promise<void> {
		return await super.disconnect();
	}
}
