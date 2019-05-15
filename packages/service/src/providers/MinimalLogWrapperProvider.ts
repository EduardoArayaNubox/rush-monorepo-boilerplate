import {Provider, inject} from '@loopback/context';

import {MinimalLogFactory} from '@sixriver/cfs_models';
import {LoggerBindings, LoggerFactory} from '@sixriver/wis-common';

// TODO: share this class

export class MinimalLogWrapperProvider implements Provider<MinimalLogFactory> {
	constructor(
		@inject(LoggerBindings.LOGGER_FACTORY)
		private readonly loggerFactory: LoggerFactory
	) {
	}

	value(): MinimalLogFactory {
		// for some reason can't just return the bound function
		// the overload that accepts a constructor confuses typescript
		return (component: string) => this.loggerFactory.createLogger(component);
	}
}
