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
	/* eslint-disable indent */ // bug workaround
		@inject(CommonBindings.PROCESS_ENV)
		private readonly env: NodeJS.ProcessEnv,
		@inject('datasources.config.' + TemplateDataSource.name, {optional: true})
		dsConfig: AnyObject = defaultConfig,
		/* eslint-enable indent */
	) {
		//
		super(dsConfig = fillDataSourceConfig(dsConfig, defaultConfig, databaseBaseName, env));
	}
}
