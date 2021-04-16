import { Console } from 'console';

import { Response } from '@loopback/rest';
import { TemplateMessage } from '@sixriver/template-oas';
import { MinimalLogFactory, MinimalLogger, Validator } from '@sixriver/typescript-support';
import Ajv from 'ajv';
import { assert } from 'chai';
import Chance from 'chance';
import * as sinon from 'sinon';
import uuidv4 from 'uuid/v4';

import { TemplateController } from '../../../src/controllers';
import { TemplateMessageModel } from '../../../src/models';

const chance = new Chance();

class MockValidator<T, TError = unknown> implements Validator<T, TError> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public tryValidate(value: unknown, errors?: Error[], confirmations?: string[]): value is T {
		throw new Error('Stub method tryValidate not implemented');
	}
}

describe(TemplateController.name, function () {
	let requestValidator: Validator<TemplateMessage, Ajv.ErrorObject>;
	let log: MinimalLogger;
	let logFactory: MinimalLogFactory;
	let response: Response;
	let controller: TemplateController;

	let requestMessage: TemplateMessageModel;

	beforeEach(async function () {
		log = new Console(process.stdout, process.stderr);
		sinon.stub(log, 'trace').returns(undefined);
		sinon.stub(log, 'debug').returns(undefined);
		logFactory = () => log;

		requestValidator = new MockValidator<TemplateMessage, Ajv.ErrorObject>();

		response = {} as any;

		controller = new TemplateController(requestValidator, response, logFactory);

		requestMessage = new TemplateMessageModel({
			id: uuidv4(),
			data: {
				[chance.word()]: chance.word(),
			},
		});

		const infoStub = sinon.stub(log, 'info').callThrough();
		infoStub
			.withArgs(sinon.match({ message: { id: requestMessage.id } }), sinon.match.any)
			.returns(undefined);
	});

	context('create', function () {
		it('should return the created object id in the happy path', async function () {
			const validateMessage = sinon.stub(requestValidator, 'tryValidate').callThrough();
			validateMessage.withArgs(sinon.match(requestMessage)).returns(true);

			const result = await controller.create(requestMessage);

			assert.isOk(result);
			assert.propertyVal(result, 'id', requestMessage.id);
			sinon.assert.calledOnce(validateMessage);
		});

		// TODO: should have more forms of invalid entities
		it('should throw UnprocessableEntity if the validator rejects', async function () {
			delete (requestMessage as Partial<typeof requestMessage>).id;
			const validateMessage = sinon.stub(requestValidator, 'tryValidate').callThrough();
			const vmStub = validateMessage.withArgs(sinon.match(requestMessage));
			const inducedErrorMessage = 'induced validation failure';
			vmStub.callsFake((input: unknown, output?: Error[]) => {
				assert.isOk(output);
				output?.push(new Error(inducedErrorMessage));
				return false;
			});
			sinon
				.stub(log, 'error')
				.callThrough()
				.withArgs(sinon.match({ err: { status: 422 } }), sinon.match.any)
				.returns(undefined);

			try {
				await controller.create(requestMessage);
				assert.fail(undefined, undefined, 'Should have thrown an exception');
			} catch (err) {
				assert.match(err.message, /invalid.*message/i);
				assert.nestedProperty(err, 'details.errors');
				assert.lengthOf(err.details.errors, 1);
				assert.nestedPropertyVal(err, 'details.errors[0].message', inducedErrorMessage);
			}
		});
	});
});
