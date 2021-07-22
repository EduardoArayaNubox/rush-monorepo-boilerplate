import 'source-map-support/register';

import * as fs from 'fs';
import { join, basename } from 'path';
import { promisify } from 'util';

import { SchemaObject } from 'ajv';
import ajvFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020';
import { get } from 'lodash';
import { OpenAPI } from 'openapi-types';

import { getDirectories } from './FileUtils';
import { schemaVersion } from './jsonSchemaVersion';
import { parseOasYamlFile } from './parseOasYaml';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

// this is a command line script, it definitely uses the console
/* eslint-disable no-console */

const ajv = ajvFormats(
	new Ajv2020({
		// do not log output from AJV, it goes to stderr and that makes rush test fail
		logger: false,
	}),
	['date-time', 'float', 'int32'],
);

function buildSchemaValidator(name: string, schema: any) {
	try {
		return ajv.compile(schema);
	} catch (err) {
		console.error(`failed to build schema validator for ${name}`, err);
		throw err;
	}
}

async function testOneSamplesDir(samplesPath: string, api: OpenAPI.Document) {
	let failures = 0;

	const sampleFolder = basename(samplesPath);
	const sampleFileNames = (await readdir(samplesPath)).filter((name) => name.endsWith('.json'));

	const modelPath = `components.schemas.${sampleFolder}`;
	const oasModel = get(api, modelPath, null);
	if (!oasModel) {
		throw new Error(`Schema ${sampleFolder} does not exist.`);
	}

	const schema: SchemaObject = { ...oasModel, $schema: schemaVersion };
	const validate = buildSchemaValidator(modelPath, schema);
	await Promise.all(
		sampleFileNames.map(async (sampleFileName) => {
			const contents = await readFile(join(samplesPath, sampleFileName));
			const sample = JSON.parse(contents.toString());
			const valid = validate(sample);
			if (await valid) {
				console.log(`${api.info.version} - ${sampleFolder} - ${sampleFileName} - Valid.`);
			} else if (!validate.errors) {
				throw new Error('WAT: AJV invalid but no errors?');
			} else {
				console.error(`${api.info.version} - ${sampleFolder} - ${sampleFileName} - INVALID!`);
				++failures;
				validate.errors.forEach((error) => {
					console.error(error);
				});
				console.log();
			}
		}),
	);

	if (failures !== 0) {
		console.error(`There were ${failures} examples in ${samplesPath} that failed`);
	}
	return failures;
}

async function testSamplesAgainstApi(apiPath: string, api: OpenAPI.Document) {
	const samplesPath = join(apiPath, 'samples');

	const schemaDirs = (await getDirectories(samplesPath)).map((d) => join(samplesPath, d));

	let failures = 0;

	await Promise.all(
		schemaDirs.map(async (schemaDir) => {
			// ??? doing `failures += await ...` doesn't work, seems to change how `failures` is closed
			const schemaFailures = await testOneSamplesDir(schemaDir, api);
			failures += schemaFailures;
		}),
	);

	if (failures !== 0) {
		console.error(`There were ${failures} examples in ${apiPath} that failed`);
	}

	return failures;
}

async function run(rootDir: string) {
	try {
		const api = await parseOasYamlFile(join(rootDir, 'template-openapi.yaml'), {
			dereference: true,
			stripTsTypes: true,
		});

		const failures = await testSamplesAgainstApi(rootDir, api);
		if (failures !== 0) {
			console.error(`There were ${failures} examples that failed to validate against their schema`);
			process.exitCode = 1;
		}
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
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
