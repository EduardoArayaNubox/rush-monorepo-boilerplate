import { assert } from 'chai';

export function assertArray(object: unknown): object is unknown[] {
	assert.isArray(object);
	return true;
}
