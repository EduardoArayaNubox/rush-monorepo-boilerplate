import * as Ajv from 'ajv';
const JsonSchemaDraft4 = require('ajv/lib/refs/json-schema-draft-04.json');

import {MinimalLogFactory, MinimalLogger} from '@sixriver/cfs_models';

import {Validator} from './Validator';

// TODO: share this code with replen

export class JsonSchema4Validator<T> implements Validator<T, Ajv.ErrorObject> {
	private readonly logger: MinimalLogger;
	private readonly validateImpl: Ajv.ValidateFunction;

	constructor(
		schema: object | boolean,
		schemaName: string,
		logFactory: MinimalLogFactory,
	) {
		this.logger = logFactory(`${this.constructor.name}/${schemaName}`);
		const a = new Ajv({
			// JSON Schema draft 4 support
			schemaId: 'id',
			// OAS v3 support
			unknownFormats: ['int32', 'float'],
			logger: {
				log: this.logger.info.bind(this.logger),
				warn: this.logger.warn.bind(this.logger),
				error: this.logger.error.bind(this.logger),
			},
		});

		 // Explicitly use JSON Schema Draft 4
		a.addMetaSchema(JsonSchemaDraft4);

		this.validateImpl = a.compile(schema);
		// TODO: supporting async schemas wouldn't be hard
		/* istanbul ignore if */
		if (this.validateImpl.$async) {
			throw new Error('Asynchronous schemas are not supported');
		}
	}

	async tryValidate(object: T): Promise<true | Ajv.ErrorObject[]> {
		const validateResult = this.validateImpl(object);
		// TODO: supporting async schemas wouldn't be hard
		/* istanbul ignore if */
		if ((typeof validateResult) !== 'boolean') {
			throw new Error('Asynchronous schemas are not supported');
		}

		if (validateResult) {
			return true;
		} else {
			return this.validateImpl.errors!;
		}
	}
}
