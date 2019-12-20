import {JSONSchema4} from './JSONSchema4';

// NOTE: this mainly exists because `json-schema-to-typescript` doesn't understand '"format": "date-time"',
// see here: https://github.com/bcherny/json-schema-to-typescript/issues/183

/**
 * Recursively update a json schema object to add annotations for `json-schema-to-typescript`
 * to mark any `date` or `date-time` string properties as being `Date | string`.
 *
 * @param schema Schema to adjust, will be modified in-place
 * @returns Adjusted schema
 */
export function applyDateFormat(schema: JSONSchema4): JSONSchema4 {
	if (typeof schema !== 'object' || schema === null || schema === undefined) {
		return schema;
	}
	if (Array.isArray(schema)) {
		for (let i = 0; i < schema.length; ++i) {
			schema[i] = applyDateFormat(schema[i]);
		}
	} else {
		if (schema.format === 'date' || schema.format === 'date-time') {
			// don't overwrite `tsType` if it was already provided
			if (!('tsType' in schema)) {
				schema.tsType = 'Date | string';
			}
			return schema;
		}
		for (const [key, value] of Object.entries(schema)) {
			schema[key] = applyDateFormat(value);
		}
	}
	return schema;
}
