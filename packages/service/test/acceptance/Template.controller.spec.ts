import * as _ from 'lodash';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const assert = chai.assert;
import * as Chance from 'chance';
const chance = new Chance();
import * as nock from 'nock';
import * as sinon from 'sinon';

import axios from 'axios';
import * as url from 'url';
import * as uuidv4 from 'uuid/v4';

import {EntityCrudRepository} from '@loopback/repository';

import {ServiceDirectory} from '@sixriver/cfs_models';

import {TemplateServiceApplication} from '../../src';
import {TemplateController} from '../../src/controllers';
import {TemplateMessageModel} from '../../src/models';
import {TemplateServiceProviderKeys} from '../../src/providers';

describe(`acceptance/${TemplateController.name}`, function() {
	let app: TemplateServiceApplication;
	let sd: ServiceDirectory;
	let selfBaseUrl: string;

	beforeEach(async function() {
		nock.cleanAll();
		if (!nock.isActive()) {
			nock.activate();
		}
		nock.disableNetConnect();

		app = new TemplateServiceApplication({});
		const fakeEnv = {...process.env};
		fakeEnv.TEST_MODE = 'acceptance';
		app.bind(TemplateServiceProviderKeys.PROCESS_ENV).to(fakeEnv);
		await app.boot();
		await app.start();

		sd = await app.get(TemplateServiceProviderKeys.SERVICE_DIRECTORY);
		// TODO: use your real service name here
		selfBaseUrl = sd.getBaseUrl('template-service' as any);
		const selfUrl = url.parse(selfBaseUrl);
		nock.enableNetConnect(url.format({hostname: selfUrl.hostname, port: selfUrl.port}));
	});

	afterEach(async function() {
		await app.stop();

		nock.cleanAll();
		nock.enableNetConnect();
		nock.restore();
	});

	context('ensure semantics / ingestion idempotency', function() {
		let request: TemplateMessageModel;

		beforeEach(function() {
			request = new TemplateMessageModel({
				id: uuidv4(),
				data: {
					[chance.word()]: chance.word(),
				},
			});
		});

		it('should accept requests', async function() {
			const result = await axios.post(`${selfBaseUrl}/template`, request);

			assert.isOk(result);
			assert.deepEqual(result.data, {id: request.id});
		});
	});
});


