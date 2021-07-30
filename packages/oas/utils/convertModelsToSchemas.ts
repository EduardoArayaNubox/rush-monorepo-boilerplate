import 'source-map-support/register';

import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import { dereference, JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { allSettledAndThrow } from '@sixriver/typescript-support';
import { SchemaObject } from 'ajv';
import { compile, DEFAULT_OPTIONS } from 'json-schema-to-typescript';
import _ from 'lodash';
import { OpenAPI } from 'openapi-types';

import { applyDateFormat } from './applyDateFormat';
import { JsonParser, YamlParser } from './json-schema-to-typescript-parsers';
import { schemaVersion } from './jsonSchemaVersion';
import { parseOasYamlFile } from './parseOasYaml';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

type StringKeyed = { [k: string]: unknown };

// this is a command line script, it definitely uses the console
/* eslint-disable no-console */

async function safeMkdir(directoryPath: string) {
	try {
		await mkdir(directoryPath);
	} catch (err) {
		if (err.code === 'EEXIST') {
			return;
		} else {
			throw err;
		}
	}
}

function magicRefs(obj: StringKeyed) {
	if (
		obj['$ref'] &&
		typeof obj['$ref'] === 'string' &&
		obj['$ref'].indexOf('#/components/schemas/') === 0
	) {
		const r = /^#\/components\/schemas\//;
		obj['$ref'] = obj['$ref'].replace(r, '#/definitions/');
	}
	for (const key of Object.keys(obj)) {
		if (typeof obj[key] === 'object' && obj[key]) {
			magicRefs(obj[key] as StringKeyed);
		}
	}
}

async function generateSchemas(path: string, api: OpenAPI.Document) {
	const schemasPath = join(path, 'schemas');
	await safeMkdir(schemasPath);

	const schemas = Object.assign(
		{},
		_.get(await dereference(_.cloneDeep(api) as JSONSchema), 'components.schemas', {}),
	);

	await Promise.all(
		Object.keys(schemas).map(async (schemaName) => {
			const schema = schemas[schemaName];
			schema.$schema = schemaVersion;
			const file = join(schemasPath, `${schemaName}.json`);
			const content = JSON.stringify(schema, null, 2);
			await write(schemaName, file, content);
		}),
	);
}

async function generateInterfaces(
	path: string,
	api: OpenAPI.Document,
	apiName: string,
	...schemaNames: string[]
) {
	const interfacesPath = join(path, 'generated-interfaces');
	await safeMkdir(interfacesPath);

	// if only exporting for some schemas, need to dereference things first
	if (schemaNames.length) {
		api = (await dereference(_.cloneDeep(api) as JSONSchema)) as any;
	}

	let schemas = Object.assign({}, _.get(api, 'components.schemas', {}));
	if (!schemaNames.length) {
		schemaNames = Object.keys(schemas);
	} else {
		schemas = _.pick(schemas, schemaNames);
	}
	console.log(`schemas: ${schemaNames.join(', ')}`);

	// need to fix refs on all schemas, even the ones we are not directly exporting
	for (const s of Object.values(schemas)) {
		if (typeof s !== 'object') {
			throw new Error('Unexpected non-object schema entry');
		}
		magicRefs(s as StringKeyed);
	}
	const schema: SchemaObject = { definitions: schemas };
	schema.$schema = schemaVersion;
	const preparedSchema = applyDateFormat(schema);
	const content = await compile(preparedSchema, apiName, {
		unreachableDefinitions: true,
		bannerComment: '/* eslint-disable */\n' + DEFAULT_OPTIONS.bannerComment,
		$refOptions: {
			parse: {
				json: JsonParser,
				yaml: YamlParser,
			},
		},
	});
	const file = join(interfacesPath, `${apiName}.ts`);
	await write('typescript interfaces', file, content);
}

async function write(schemaName: string, file: string, content: string) {
	console.log(`writing ${schemaName} to ${file}`);
	await writeFile(file, content);
}

async function run(rootDir: string) {
	try {
		const api = await parseOasYamlFile(join(rootDir, 'template-openapi.yaml'));
		await allSettledAndThrow([
			generateSchemas(join(rootDir, 'dist'), api),
			generateInterfaces(rootDir, api, 'template-openapi'),
		]);
	} catch (error) {
		// set the exitCode first, in case serializing the error throws
		process.exitCode = 1;
		console.log(error);
	}
}

if (require.main === module) {
	// make sure any weirdness is fatal
	process.on('unhandledRejection', (err) => {
		process.exitCode = 1;
		throw err;
	});
	run(process.cwd()).catch((err) => {
		console.error(err);
		process.exitCode = 1;
	});
}
