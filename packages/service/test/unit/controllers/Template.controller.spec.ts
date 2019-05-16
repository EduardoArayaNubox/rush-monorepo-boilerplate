import {assert} from 'chai';
import * as Chance from 'chance';
const chance = new Chance();
import * as sinon from 'sinon';

import * as _ from 'lodash';
import * as Ajv from 'ajv';
import {Console} from 'console';
import * as uuidv4 from 'uuid/v4';

import {Response} from '@loopback/rest';

import {MinimalLogFactory, MinimalLogger} from '@sixriver/typescript-support';
import {Validator} from '@sixriver/loopback4-support';

import {TemplateMessage} from '@sixriver/template-oas';

import {TemplateController} from '../../../src/controllers';
import {TemplateMessageModel} from '../../../src/models';

class MockValidator<T, TError = any> implements Validator<T, TError> {
	public async tryValidate(object: T): Promise<true | TError[]> {
		throw new Error('Stub method tryValidate not implemented');
	}
}

function createNamedStub(target: any, name: string): sinon.SinonStub {
	target[name] = function(...args: any[]) {
		throw new Error(`Stub method '${name}' not implemented: ${JSON.stringify(args)}`);
	};
	return sinon.stub(target, name).callThrough();
}

describe(TemplateController.name, function() {
	let requestValidator: Validator<TemplateMessage, Ajv.ErrorObject>;
	let log: MinimalLogger;
	let logFactory: MinimalLogFactory;
	let response: Response;
	let controller: TemplateController;

	let requestMessage: TemplateMessageModel;

	beforeEach(async function() {
		log = new Console(process.stdout, process.stderr);
		sinon.stub(log, 'trace').returns(undefined);
		sinon.stub(log, 'debug').returns(undefined);
		logFactory = (component: string) => log;

		requestValidator = new MockValidator<TemplateMessage, Ajv.ErrorObject>();

		response = {} as any;

		controller = new TemplateController(
			requestValidator,
			response,
			logFactory,
		);

		requestMessage = new TemplateMessageModel({
			id: uuidv4(),
			data: {
				[chance.word()]: chance.word(),
			},
		});

		const infoStub = sinon.stub(log, 'info').callThrough();
		infoStub.withArgs(sinon.match({message: {id: requestMessage.id}})).returns(undefined);
	});

	context('create', function() {
		it('should return the created object id in the happy path', async function() {
			const validateMessage = sinon.stub(requestValidator, 'tryValidate').callThrough();
			validateMessage.withArgs(sinon.match(requestMessage)).resolves(true);

			const result = await controller.create(requestMessage);

			assert.isOk(result);
			assert.propertyVal(result, 'id', requestMessage.id);
			sinon.assert.calledOnce(validateMessage);
		});

		// TODO: should have more forms of invalid entities
		it('should throw UnprocessableEntity if the validator rejects', async function() {
			delete requestMessage.id;
			const validateMessage = sinon.stub(requestValidator, 'tryValidate').callThrough();
			const vmStub = validateMessage.withArgs(sinon.match(requestMessage));
			const inducedErrorMessage = 'induced validation failure';
			vmStub.resolves([new Error(inducedErrorMessage)]);
			sinon.stub(log, 'error').callThrough()
			.withArgs(sinon.match({err: {status: 422}})).returns(undefined);

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
