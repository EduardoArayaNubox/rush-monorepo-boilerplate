import * as fs from 'fs';
import { promisify } from 'util';

import { dereference, JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { Parsers } from '@stoplight/spectral';
import * as _ from 'lodash';
import { OpenAPI } from 'openapi-types';

const readFile = promisify(fs.readFile);

export type ParseYamlOptions = {
	stripTsTypes?: boolean;
	dereference?: boolean;
};

export async function parseOasYamlFile(
	path: string,
	options?: ParseYamlOptions,
): Promise<OpenAPI.Document> {
	const yaml = await readFile(path, 'utf8');
	return await parseOasYaml(yaml, options);
}

export async function parseOasYaml(
	yaml: string,
	options?: ParseYamlOptions,
): Promise<OpenAPI.Document> {
	const parserResult = await Parsers.parseYaml(yaml);
	let result = _.cloneDeep(parserResult.data) as OpenAPI.Document;

	if (options?.stripTsTypes) {
		function fixer(value: any, key: string, owner: any) {
			if (key === 'tsType') {
				delete owner[key];
			}
			if (typeof value === 'object') {
				_.forIn(value, fixer);
			}
		}
		_.forIn(result, fixer);
	}

	if (options?.dereference) {
		result = (await dereference(result as JSONSchema)) as OpenAPI.Document;
	}

	return result;
}
