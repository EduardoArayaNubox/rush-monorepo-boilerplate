import {assert} from 'chai';

import {
	FindRoute,
	InvokeMethod,
	ParseParams,
	Reject,
	Send,
} from '@loopback/rest';

import {TemplateServiceSequence} from '../../src/TemplateServiceSequence';

describe(TemplateServiceSequence.name, function() {
	it('should have a test', function() {
		const app = new TemplateServiceSequence(
			{} as FindRoute,
			{} as ParseParams,
			{} as InvokeMethod,
			{} as Send,
			{} as Reject
		);
		assert.isOk(app);
	});
});
