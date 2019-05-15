import {Provider, inject} from '@loopback/context';

import {
	ServiceDirectory,
	MinimalLogFactory,
	InternalDirectoryFactory,
	isValidEnvironment,
} from '@sixriver/cfs_models';

import {TemplateServiceProviderKeys} from './TemplateServiceProviderKeys';

export class ServiceDirectoryProvider implements Provider<ServiceDirectory> {
	constructor(
		@inject(TemplateServiceProviderKeys.PROCESS_ENV)
		private readonly env: NodeJS.ProcessEnv,
		@inject(TemplateServiceProviderKeys.LOG_FACTORY)
		private readonly logFactory: MinimalLogFactory,
	) {
	}

	public value(): ServiceDirectory {
		const sdf = new InternalDirectoryFactory(this.logFactory);
		const nodeEnv = this.env['NODE_ENV'];
		if (!isValidEnvironment(nodeEnv)) {
			throw new Error('Cannot setup container type validator without a valid NODE_ENV');
		}
		return sdf.manufacture(nodeEnv);
	}
}
