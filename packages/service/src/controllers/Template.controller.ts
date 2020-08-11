import * as _ from 'lodash';
import Ajv from 'ajv';

import {inject} from '@loopback/context';
import {post, api, HttpErrors, RestBindings, requestBody, Response} from '@loopback/rest';

import {MinimalLogFactory, MinimalLogger, Validator, safeErrors} from '@sixriver/typescript-support';
import {ApiSchemaBuilder, CommonBindings} from '@sixriver/loopback4-support';

import {TemplateMessage} from '@sixriver/template-oas';

import {ObjectIdModel, TemplateMessageModel} from '../models';
import {TemplateServiceProviderKeys} from '../providers';

const schemaBuilder = new ApiSchemaBuilder();
schemaBuilder.appendModel(TemplateMessageModel);

const EntityBasePath = '/template';

@api(schemaBuilder.createControllerApiDefinitions({
	basePath: '/v1',
	paths: {},
}))
export class TemplateController {
	private readonly logger: MinimalLogger;

	constructor(
		@inject(TemplateServiceProviderKeys.REQUEST_VALIDATOR)
		private readonly requestValidator: Validator<TemplateMessage, Ajv.ErrorObject>,
		@inject(RestBindings.Http.RESPONSE)
		private readonly response: Response,
		@inject(CommonBindings.LOG_FACTORY)
		loggerFactory: MinimalLogFactory
	) {
		this.logger = loggerFactory(this.constructor.name);
	}

	@post(EntityBasePath, {
		responses: {
			'201': {
				description: 'Template accepted',
				content: {
					'application/json': {
						schema: {'x-ts-type': ObjectIdModel},
					},
				},
			},
		},
	})
	async create(
		@requestBody()
			message: TemplateMessageModel,
	): Promise<ObjectIdModel> {
		try {
			this.logger.info(
				{message: _.pick(message, 'id', 'timestamp', 'source', 'destinations')},
				'Received template request',
			);

			const validationErrors: Error[] = [];
			if (!(await this.requestValidator.tryValidate(message, validationErrors))) {
				return await this.handleInvalidRequest(message, validationErrors);
			}

			this.response.statusCode = 201;

			return new ObjectIdModel({id: message.id});
		} catch (err) {
			// don't try to persist this error as an event, as it may have come from trying to persist an event
			this.logger.error({err}, 'Failed to ingest template message');
			throw err;
		}
	}

	// note that we take in the message as an any because, if we got here, we _know_ it is _not_ valid
	private async handleInvalidRequest(message: any, errors: any[]): Promise<never> {
		// remove any circular references and deep nested structures from the errors objects
		// having those causes many problems with both recording events and throwing the HTTP error later
		errors = safeErrors(errors);

		// TODO: we would like this to send a structured error, but that doesn't work when throwing an HttpError
		const err = new HttpErrors.UnprocessableEntity('Invalid template message received');
		err.details = {errors: errors.filter((e) => e !== null && e !== undefined).map((e) => ({
			message: e.message,
			...e,
		}))};
		this.logger.error({err}, err.message);
		throw err;
	}
}
