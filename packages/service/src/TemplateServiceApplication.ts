/* istanbul ignore next */ // ignore boilerplate enabling instrumentation in prod
if (process.env.NODE_ENV === 'production' && process.env.APM === 'true') {
	require('instana-nodejs-sensor')();
}

import * as _ from 'lodash';

import {ApplicationConfig, Provider, BindingScope} from '@loopback/core';
import {RestApplication, RestServer, RestBindings} from '@loopback/rest';
import {Constructor, inject} from '@loopback/context';

import {RepositoryMixin} from '@loopback/repository';
import {BootMixin} from '@loopback/boot';

import {
	configureServiceConfig,
	ServiceConfig,
	ServiceConfigBindings,
	ServiceConfigOptions,
	Logger,
	LoggerBindings,
	LoggingConfigOptions,
	getDefaultLoggingConfiguration,
	configureLogging,
	KillController,
	envRestOptions,
	UptimeController,
	bindPathAwareExplorer,
} from '@sixriver/wis-common';
import {MinimalLogFactory} from '@sixriver/cfs_models';

import {TemplateMessage, TemplateMessageSchema} from '@sixriver/template-oas';

import {
	MinimalLogWrapperProvider,
	TemplateServiceProviderKeys,
	JsonSchema4ValidatorProvider,
	ServiceDirectoryProvider,
} from './providers';
import {DbMigrateBooter} from './components';

import {TemplateServiceSequence} from './TemplateServiceSequence';

const defaultListenHost = '0.0.0.0';
// FIXME: we want to get this out of the service directory, but there's a chicken/egg problem with that
const defaultDefaultListenPort = 9999;

const defaultListenPort = ['development', 'production'].includes(process.env.NODE_ENV || '')
	? defaultDefaultListenPort : defaultDefaultListenPort + 10000;

export type TemplateServiceApplicationArguments = {
	options?: ApplicationConfig,
	loggingOptions?: LoggingConfigOptions,
	serviceConfig?: Constructor<Provider<ServiceConfig>> | ServiceConfig,
	env?: NodeJS.ProcessEnv,
};

// eslint-disable-next-line 6river/new-cap
export class TemplateServiceApplication extends BootMixin(RepositoryMixin(RestApplication)) {
	private logger?: Logger;

	public constructor(args: TemplateServiceApplicationArguments) {
		if (!args.options) {
			args.options = {};
		}

		_.defaults(args.options, envRestOptions({
			rest: {
				host: defaultListenHost,
				port: defaultListenPort,
			},
		}));

		super(args.options);

		// Set up the custom sequence
		this.sequence(TemplateServiceSequence);

		this.projectRoot = __dirname;

		// NOTE: for unknown reasons, things seem to be a bit titchy about where exactly in the constructor we put this line
		// don't move it without verifying it works both locally on your dev machine AND in a cluster!
		bindPathAwareExplorer(this);

		// Customize @loopback/boot Booter Conventions here
		this.bootOptions = {
			controllers: {
				// Customize ControllerBooter Conventions here
				dirs: ['controllers'],
				extensions: ['.controller.js'],
				nested: true,
			},
			datasources: {
				dirs: ['datasources'],
				extensions: ['.datasource.js'],
				nested: true,
			},
			repositories: {
				dirs: ['repositories'],
				extensions: ['.repository.js'],
				nested: true,
			},
		};

		this.bind(TemplateServiceProviderKeys.DB_MIGRATE_SCOPE).to('packoutRequest').inScope(BindingScope.SINGLETON);
		this.booters(DbMigrateBooter);

		// register dependencies

		if (!args.env) {
			args.env = process.env;
		}
		this.bind(TemplateServiceProviderKeys.PROCESS_ENV).to(args.env);

		configureLogging(this, TemplateServiceApplication.getLoggingConfigOptions(args.loggingOptions));
		this.bind(TemplateServiceProviderKeys.LOG_FACTORY)
		.toProvider(MinimalLogWrapperProvider).inScope(BindingScope.SINGLETON);
		// TODO: not sure what's the right thing to do here for configuring dependencies... maybe "Component"s?
		// TODO: this is probably not right, LB4 config is not fully baked yet, for example:
		//		https://github.com/strongloop/loopback.io/issues/540)
		//		https://github.com/strongloop/loopback-next/issues/1054)
		this.configureServiceConfig(args.serviceConfig);

		// Add the standard controllers
		this.controller(KillController);
		this.controller(UptimeController);

		this.bind(TemplateServiceProviderKeys.SERVICE_DIRECTORY).toProvider(ServiceDirectoryProvider)
		.inScope(BindingScope.SINGLETON);

		class TemplateMessageValidatorProvider extends JsonSchema4ValidatorProvider<TemplateMessage> {
			constructor(
				@inject(TemplateServiceProviderKeys.LOG_FACTORY)
					logFactory: MinimalLogFactory,
			) {
				super(TemplateMessageSchema, 'TemplateMessage', logFactory);
			}
		}
		this.bind(TemplateServiceProviderKeys.REQUEST_VALIDATOR)
		// note: the JSON schema file doesn't get copied to dist, so have to lift ourselves out of `dist10/src`
		.toProvider(TemplateMessageValidatorProvider)
		.inScope(BindingScope.SINGLETON);
	}

	public async start() {
		this.bind(UptimeController.STARTED_TIME).to(new Date());

		const loggerFactory = await this.get(LoggerBindings.LOGGER_FACTORY);
		this.logger = loggerFactory.createLogger(TemplateServiceApplication);

		await super.start();

		const server = await this.getServer(RestServer);
		const port = await server.get(RestBindings.PORT);

		this.logger.info(`Server is running at http://127.0.0.1:${port}`);
		this.logger.info(`OpenApi spec: http://127.0.0.1:${port}/openapi.json`);
		this.logger.info(`API explorer: http://127.0.0.1:${port}/explorer`);
	}

	public static getLoggingConfigOptions(loggingConfigOptions?: LoggingConfigOptions): LoggingConfigOptions {
		loggingConfigOptions = loggingConfigOptions || {};
		// if a logger factory is given, we don't need the logger config
		if (!loggingConfigOptions.loggerFactory && !loggingConfigOptions.logging) {
			loggingConfigOptions.logging = getDefaultLoggingConfiguration('packout-ingestion');
		}
		return loggingConfigOptions;
	}

	private configureServiceConfig(serviceConfig?: Constructor<Provider<ServiceConfig>> | ServiceConfig) {
		if (serviceConfig) {
			this.bindServiceConfig(serviceConfig);
		} else {
			const options = TemplateServiceApplication.getServiceConfigOptions();

			if (options) {
				configureServiceConfig(this, options);
			} else {
				this.bindServiceConfig({});
			}
		}
	}

	public static getServiceConfigOptions(env?: NodeJS.ProcessEnv): ServiceConfigOptions | undefined {
		env = env || process.env;
		if (env.NODE_ENV === 'production') {
			if (!env.SITE_NAME) {
				throw new Error('SITE_NAME not set');
			}
			return {
				grmUrl: env.GRM_URL || 'https://grm.6river.org/v1',
				siteName: env.SITE_NAME,
			};
		}

		if (env.USE_GRM) {
			if (!env.SITE_NAME) {
				throw new Error('SITE_NAME not set');
			}
			return {
				grmUrl: env.GRM_URL || 'http://localhost:3004/v1',
				siteName: env.SITE_NAME,
			};
		}

		return undefined;
	}

	private bindServiceConfig(serviceConfig: Constructor<Provider<ServiceConfig>> | ServiceConfig) {
		if (typeof serviceConfig === 'function') {
			this.bind(ServiceConfigBindings.SERVICE_CONFIGURATION)
			// Doesn't seem to be a good way to do a runtime type guard for a constructable
			.toProvider(serviceConfig as Constructor<Provider<ServiceConfig>>)
			.scope = BindingScope.SINGLETON;
		} else {
			this.bind(ServiceConfigBindings.SERVICE_CONFIGURATION)
			.to(serviceConfig)
			.scope = BindingScope.SINGLETON;
		}
	}
}
