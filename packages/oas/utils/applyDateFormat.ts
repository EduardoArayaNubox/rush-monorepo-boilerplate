// NOTE: this mainly exists because `json-schema-to-typescript` doesn't understand '"format": "date-time"',
//		 see here: https://github.com/bcherny/json-schema-to-typescript/issues/183
export default function applyDateFormat(schema: any) {
	if (typeof schema !== 'object') {
		return schema;
	}
	if (schema.format === 'date' || schema.format === 'date-time') {
		return {...schema, tsType: 'Date | string'};
	}
	const result = Array.isArray(schema)
		? [...schema]
		: {...schema};
	for (const [key, value] of Object.entries(schema)) {
		schema[key] = applyDateFormat(value);
	}
	return result;
}
