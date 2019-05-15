import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const assert = chai.assert;
import * as Chance from 'chance';
const chance = new Chance();
import * as sinon from 'sinon';

import {Console} from 'console';
import * as uuidv4 from 'uuid/v4';

import {MinimalLogFactory, MinimalLogger} from '@sixriver/cfs_models';

import {TemplateMessageSchema, TemplateMessage} from '@sixriver/template-oas';

import {JsonSchema4Validator} from '../../../src/components';

import {assertArray} from '../../mocks/TestUtils';


describe(JsonSchema4Validator.name, function() {
	let logFactory: MinimalLogFactory;
	let log: MinimalLogger;
	let validator: JsonSchema4Validator<any>;
	let obj: any;

	const optionalProps = new Set(['inServiceOf']);

	function buildRequest(): TemplateMessage {
		return {
			messageType: 'packoutRequest',
			timestamp: new Date().toISOString(),
			id: uuidv4(),
			source: {
				containerID: chance.natural().toString(),
			},
			workflow: 'discrete',
			destinations: [{
				displayID: chance.word(),
				containerType: {
					externalId: chance.word(),
					name: chance.word(),
				},
				printData: {
					containerID: chance.natural().toString(),
					groupID: chance.word().toString(),
					groupType: 'batchPick',
				},
			}],
			inServiceOf: [{type: chance.word(), id: uuidv4()}],
		};
	}

	beforeEach(function() {
		log = new Console(process.stdout, process.stderr);
		sinon.stub(log, 'warn').callThrough()
		.withArgs('schema $id ignored', 'http://json-schema.org/draft-07/schema#').returns(undefined);
		logFactory = (componentName: string) => log;
		validator = new JsonSchema4Validator(TemplateMessageSchema, 'TemplateMessage', logFactory);
		obj = buildRequest();
	});

	it('should OK valid requests', async function() {
		await assert.eventually.isTrue(validator.tryValidate(obj));
	});

	for (const prop of Object.getOwnPropertyNames(buildRequest())) {
		if (optionalProps.has(prop)) {
			continue;
		}
		it(`should fail invalid request: removed '${prop}'`, async function() {
			delete obj[prop];
			const result = await validator.tryValidate(obj);
			if (assertArray(result)) {
				assert.isAtLeast(result.length, 1);
				assert.nestedPropertyVal(result, '[0].keyword', 'required');
				assert.nestedPropertyVal(result, '[0].params.missingProperty', prop);
			}
		});
	}
});
