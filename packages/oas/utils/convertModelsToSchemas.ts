require('source-map-support').install();

import * as fs from 'fs';
import * as _ from 'lodash';
const toJsonSchema = require('openapi-schema-to-json-schema');
import {join} from 'path';
const SwaggerParser = require('swagger-parser');
import {promisify} from 'util';
import {compile, DEFAULT_OPTIONS} from 'json-schema-to-typescript';
import applyDateFormat from './applyDateFormat';
import jsonParser from './jsonParser';
import yamlParser from './yamlParser';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

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

function magicRefs(obj: any) {
	if (obj['$ref'] && obj['$ref'].indexOf('#/components/schemas/') === 0) {
		const r = /^#\/components\/schemas\//;
		obj['$ref'] = obj['$ref'].replace(r, '#/definitions/');
	}
	for (const key of Object.keys(obj)) {
		if (typeof obj[key] === 'object' && obj[key]) {
			magicRefs(obj[key]);
		}
	}
}


async function generateSchemas(path: string, api: any) {
	const schemasPath = join(path, 'schemas');
	await safeMkdir(schemasPath);

	const schemas = Object.assign({}, _.get(await SwaggerParser.dereference(_.cloneDeep(api)), 'components.schemas', {}));

	await Promise.all(Object.keys(schemas).map(
		async (schemaName) => {
			const schema = toJsonSchema(schemas[schemaName]);
			const file = join(schemasPath, `${schemaName}.json`);
			const content = JSON.stringify(schema, null, 2);
			await write(schemaName, file, content);
		}
	));
}

async function generateInterfaces(path: string, api: any, apiName: string, ...schemaNames: string[]) {
	const interfacesPath = join(path, 'generated-interfaces');
	await safeMkdir(interfacesPath);

	// if only exporting for some schemas, need to dereference things first
	if (schemaNames.length) {
		api = await SwaggerParser.dereference(_.cloneDeep(api));
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
		magicRefs(s);
	}
	const schema = toJsonSchema({definitions: schemas});
	const preparedSchema = applyDateFormat(schema);
	const content = await compile(preparedSchema, apiName, {
		unreachableDefinitions: true,
		bannerComment: '/* eslint-disable */\n' + DEFAULT_OPTIONS.bannerComment,
		$refOptions: {
			parse: {
				json: jsonParser,
				yaml: yamlParser,
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

async function parseApi(apiFolder: string, yamlName: string) {
	const apiFile = join(apiFolder, yamlName);
	return await SwaggerParser.parse(apiFile);
}

async function run(rootDir: string) {
	try {
		const api = await parseApi(rootDir, 'template-openapi.yaml');
		await Promise.all([
			generateSchemas(join(rootDir, 'dist'), api),
			generateInterfaces(rootDir, api, 'template-openapi'),
		]);
	} catch (error) {
		console.log(error);
		process.exitCode = 1;
	}
}

if (require.main === module) {
	run(process.cwd());
}
