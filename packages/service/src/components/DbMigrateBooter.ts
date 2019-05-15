import * as path from 'path';

import {BindingKey, inject, Getter} from '@loopback/context';
import {Booter} from '@loopback/boot';
import {juggler} from '@loopback/repository';

// no types for this one
// NOTE: this pollutes `globals`, see mocha.opts
const DBMigrate = require('db-migrate');
// no types for this one either, but it's simple so hack a fake in locally
const urlmask: (url: string) => string = require('url-mask');

import {LoggerBindings, LoggerFactory, Logger} from '@sixriver/wis-common';
import {TemplateServiceProviderKeys} from '../providers';

// TODO: share this code with container-split and event-ingestion-lib

export class DbMigrateBooter implements Booter {
	// TODO: Bind this to to whichever datasource you want this to use to infer the db url
	public static readonly DATASOURCE = BindingKey.create<juggler.DataSource>('db-migrate-booter-datasource')

	private readonly log: Logger;

	constructor(
	/* eslint-disable indent */ // bug workaround
		@inject(LoggerBindings.LOGGER_FACTORY)
		loggerFactory: LoggerFactory,
		@inject.getter(DbMigrateBooter.DATASOURCE)
		private readonly datasource: Getter<juggler.DataSource>,
		@inject(TemplateServiceProviderKeys.DB_MIGRATE_SCOPE)
		private readonly scope: string,
		/* eslint-enable indent */
	) {
		this.log = loggerFactory.createLogger('DbMigrateBooter');
	}

	async load(): Promise<void> {
		try {
			await this.migrate();
		} catch (err) {
			// can't cover the catch block because of process.exit
			/* istanbul ignore next */
			this.log.error({err, scope: this.scope}, `FAILED TO RUN MIGRATIONS!!!`);
			/* istanbul ignore next */
			process.exit(1);
		}
	}

	private async migrate() {
		// we end up in the 'dist*/src/components' dir at this point, migrations are two up
		const pwd = path.join(__dirname, '../../..');

		const url = await this.findDsUrl();
		/* istanbul ignore if */ // does not merit a test, shouldn't hit in CI, never in prod
		if (url === undefined) {
			this.log.info('Skipping migrations: no url, probably memory connector');
			return;
		}

		this.log.info(`Running migrations for database url: ${urlmask(url)}`);
		const options = {
			cwd: pwd,
			config: {
				'other': url,
			},
			env: 'other',
			throwUncatched: true,
		};
		const dbmigrate = DBMigrate.getInstance(true, options);
		return await dbmigrate.up(/* spec|count */ undefined, /* scope */ this.scope);
	}

	private async findDsUrl(): Promise<string | undefined> {
		const ds = await this.datasource();
		const realUrl = ds && ds.settings && ds.settings.url;
		return realUrl;
	}
}
