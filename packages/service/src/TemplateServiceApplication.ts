import * as path from 'path';

import { BootMixin } from '@loopback/boot';
import { Constructor, inject, Getter } from '@loopback/context';
import { ApplicationConfig, Provider, BindingScope } from '@loopback/core';
import { RepositoryMixin, juggler } from '@loopback/repository';
import { RestApplication, RestServer, RestBindings, DefaultSequence } from '@loopback/rest';
import { RestExplorerComponent } from '@loopback/rest-explorer';
import { ServiceConfig } from '@sixriver/config-support';
import { initializeTracing } from '@sixriver/google-cloud-trace-helpers';
import { MetricsComponent } from '@sixriver/loopback4-metrics';
import {
	CommonBindings,
	configureLogging,
	configureServiceConfig,
	DbMigrateBooterBase,
	envRestOptions,
	getDefaultLoggingConfiguration,
	getServiceConfigOptions,
	InternalServiceDirectoryProvider,
	JsonSchema2020ValidatorProvider,
	KillController,
	LoggingConfigOptions,
	SemanticHttpErrorRejectProvider,
	UptimeController,
} from '@sixriver/loopback4-support';
import { ServicePortFactory, getEnvironment } from '@sixriver/service-directory';
import { TemplateMessage, TemplateSchemas } from '@sixriver/template-oas';
import { MinimalLogFactory, MinimalLogger } from '@sixriver/typescript-support';
import * as _ from 'lodash';

import { TemplateDataSource } from './datasources';
import { TemplateServiceProviderKeys } from './providers';

initializeTracing('template-application');

const defaultListenHost = '0.0.0.0';

const defaultListenPort = new ServicePortFactory(() => console)
	.manufacture(getEnvironment(process.env))
	// FIXME: replace this with your service name and remove the `as any`
	.getPort('template-service' as any);

export type TemplateServiceApplicationArguments = {
	options?: ApplicationConfig;
	loggingOptions?: LoggingConfigOptions;
	serviceConfig?: Constructor<Provider<ServiceConfig>> | ServiceConfig;
	env?: NodeJS.ProcessEnv;
};

// eslint-disable-next-line 6river/new-cap
export class TemplateServiceApplication extends BootMixin(RepositoryMixin(RestApplication)) {
	private logger?: MinimalLogger;

	public constructor(args: TemplateServiceApplicationArguments) {
		if (!args.options) {
			args.options = {};
		}

		_.defaults(
			args.options,
			envRestOptions({
				rest: {
					host: defaultListenHost,
					port: defaultListenPort,
				},
			}),
		);

		super(args.options);

		// This allows for uncaught SemanticHttpErrors that were thrown in the application to write the `semanticErrorCode`
		// `nested`, and `message` fields to the response, instead of the default 500 InternalServerError, which hides the
		// message. If an uncaught error is thrown, and is not a SemanticHttpError, then the default behavior follows.
		// The `DefaultSequence` will ask for the `RestBindings.SequenceActions.REJECT`. Therefore its important to set
		// the `REJECT` binding _before_ setting the sequence.
		this.bind(RestBindings.SequenceActions.REJECT).toProvider(SemanticHttpErrorRejectProvider);

		this.sequence(DefaultSequence);

		this.projectRoot = __dirname;

		this.component(RestExplorerComponent);
		this.component(MetricsComponent);

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

		class DbMigrateBooter extends DbMigrateBooterBase {
			constructor(
				@inject(CommonBindings.LOG_FACTORY)
				loggerFactory: MinimalLogFactory,
				@inject.getter('datasources.' + TemplateDataSource.name)
				datasource: Getter<juggler.DataSource>,
			) {
				super(loggerFactory, datasource, 'service', path.join(__dirname, '../../'));
			}
		}
		this.booters(DbMigrateBooter);

		// register dependencies

		if (!args.env) {
			args.env = process.env;
		}
		this.bind(CommonBindings.PROCESS_ENV).to(args.env);

		configureLogging(this, TemplateServiceApplication.getLoggingConfigOptions(args.loggingOptions));
		configureServiceConfig(this, getServiceConfigOptions(), args.serviceConfig);

		// Add the standard controllers
		this.controller(KillController);
		this.controller(UptimeController);

		this.bind(TemplateServiceProviderKeys.SERVICE_DIRECTORY)
			.toProvider(InternalServiceDirectoryProvider)
			.inScope(BindingScope.SINGLETON);

		class TemplateMessageValidatorProvider extends JsonSchema2020ValidatorProvider<TemplateMessage> {
			constructor(
				@inject(CommonBindings.LOG_FACTORY)
				logFactory: MinimalLogFactory,
			) {
				super(TemplateSchemas.TemplateMessageSchema, 'TemplateMessage', logFactory);
			}
		}
		this.bind(TemplateServiceProviderKeys.REQUEST_VALIDATOR)
			// note: the JSON schema file doesn't get copied to dist, so have to lift ourselves out of `dist10/src`
			.toProvider(TemplateMessageValidatorProvider)
			.inScope(BindingScope.SINGLETON);
	}

	public async start(): Promise<void> {
		this.bind(UptimeController.STARTED_TIME).to(new Date());

		const loggerFactory = await this.get(CommonBindings.LOG_FACTORY);
		this.logger = loggerFactory(TemplateServiceApplication.name);

		await super.start();

		const server = await this.getServer(RestServer);
		const port = await server.get(RestBindings.PORT);

		this.logger.info(`Server is running at http://127.0.0.1:${port}`);
		this.logger.info(`OpenApi spec: http://127.0.0.1:${port}/openapi.json`);
		this.logger.info(`API explorer: http://127.0.0.1:${port}/explorer`);
	}

	public static getLoggingConfigOptions(
		loggingConfigOptions?: LoggingConfigOptions,
	): LoggingConfigOptions {
		loggingConfigOptions = loggingConfigOptions || {};
		// if a logger factory is given, we don't need the logger config
		if (!loggingConfigOptions.loggerFactory && !loggingConfigOptions.logging) {
			loggingConfigOptions.logging = getDefaultLoggingConfiguration('template-service');
		}
		return loggingConfigOptions;
	}
}
