import {assert} from 'chai';
import axios from 'axios';
import {AxiosError} from 'axios';
import * as uuidv4 from 'uuid/v4';

import {TemplateMessage} from '@sixriver/template-oas';

import {TemplateServiceApplication} from '../../src';
import {TemplateServiceProviderKeys} from '../../src/providers';


describe('template service', function() {
	let app: TemplateServiceApplication;
	let apiBaseUrl: string;

	beforeEach(async function() {
		app = new TemplateServiceApplication({});
		const sd = await app.get(TemplateServiceProviderKeys.SERVICE_DIRECTORY);
		const baseUrl = sd.getBaseUrl('template-service' as any);
		apiBaseUrl = `${baseUrl}/template`;
	});

	beforeEach(async function() {
		await app.boot();
		await app.start();
	});

	afterEach(async function() {
		await app.stop();
	});

	describe('POST template-message', async function() {
		it('for a valid body should return a 201 (Created) status code and an id', async function() {
			const url = `${apiBaseUrl}`;
			const postBody: TemplateMessage = {
				id: uuidv4(),
				data: {
					foo: 'bar',
				},
			};

			const result = await axios.post(url, postBody);

			assert.isOk(result);
			assert.property(result, 'status');
			assert.isNumber(result.status);
			assert.strictEqual(result.status, 201);
			assert.property(result, 'data');
			assert.isObject(result.data);
			assert.nestedProperty(result, 'data.id');
			assert.isString(result.data.id);
		});

		it('for an invalid body should return a 422 (Unprocessable Entity) status code', async function() {
			const url = `${apiBaseUrl}`;
			const postBody = {
				_bad_id: uuidv4(),
			};

			try {
				await axios.post(url, postBody);
				assert.fail(undefined, undefined, 'Should have thrown a 422 exception');
			} catch (err) {
				const ae: AxiosError = err;
				assert.nestedPropertyVal(ae, 'response.status', 422);
			}
		});
	});
});
