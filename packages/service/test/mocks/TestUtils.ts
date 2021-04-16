import { assert } from 'chai';

export function assertArray(object: any): object is any[] {
	assert.isArray(object);
	return true;
}
