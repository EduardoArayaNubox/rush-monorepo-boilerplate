import {Provider} from '@loopback/context';

import {MinimalLogFactory} from '@sixriver/cfs_models';

// using the narrow import to avoid some circular dependencies in the require loop
import {JsonSchema4Validator} from '../components/JsonSchema4Validator';

export abstract class JsonSchema4ValidatorProvider<T> implements Provider<JsonSchema4Validator<T>> {
	constructor(
		private readonly schema: object,
		private readonly schemaName: string,
		private readonly logFactory: MinimalLogFactory,
	) {
	}

	public value(): JsonSchema4Validator<T> {
		return new JsonSchema4Validator(this.schema, this.schemaName, this.logFactory);
	}
}
