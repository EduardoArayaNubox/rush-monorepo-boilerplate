import {assert} from 'chai';

import axios from 'axios';
import {AxiosError} from 'axios';
import * as uuidv4 from 'uuid/v4';

import {CommonBindings} from '@sixriver/loopback4-support';

import {TemplateServiceApplication} from '../../src';
import {TemplateServiceProviderKeys} from '../../src/providers';

describe(`acceptance/${TemplateServiceApplication.name}`, function() {
	let app: TemplateServiceApplication;

	beforeEach(async function() {
		app = new TemplateServiceApplication({});
		const fakeEnv = {...process.env};
		fakeEnv.TEST_MODE = 'acceptance';
		app.bind(CommonBindings.PROCESS_ENV).to(fakeEnv);
	});

	afterEach(async function() {
		await app.stop();
	});

	it('should boot', async function() {
		await app.boot();
		await app.start();
	});

	context('booted', function() {
		let baseUrl: string;
		let apiBaseUrl: string;

		beforeEach(async function() {
			await app.boot();
			await app.start();

			const sd = await app.get(TemplateServiceProviderKeys.SERVICE_DIRECTORY);
			baseUrl = sd.getBaseUrl('template-service' as any);
			apiBaseUrl = `${baseUrl}/template`;
		});

		it('should host an uptime controller', async function() {
			assert.isTrue(baseUrl.endsWith('/v1'));
			const result = await axios.get(baseUrl.substr(0, baseUrl.length - 3));
			assert.isOk(result);
			assert.property(result, 'data');
			assert.nestedProperty(result, 'data.started');
			assert.nestedProperty(result, 'data.uptime');
			assert.isString(result.data.started);
			assert.isNumber(result.data.uptime);
			assert.doesNotThrow(() => Date.parse(result.data.started));
			assert.isAbove(result.data.uptime, 0);
		});

		it('should host an ingest controller with a findById endpoint', async function() {
			const url = `${apiBaseUrl}/${uuidv4()}`;
			try {
				await axios.get(url);
				assert.fail(undefined, undefined, 'Should have thrown a 404 exception');
			} catch (err) {
				const ae: AxiosError = err;
				assert.nestedPropertyVal(ae, 'response.status', 404);
			}
		});
	});
});
