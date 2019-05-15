import {assert} from 'chai';

import {Constructor} from '@loopback/context';

export function assertArray(object: any): object is any[] {
	assert.isArray(object);
	return true;
}
