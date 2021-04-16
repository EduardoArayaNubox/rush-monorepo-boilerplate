import 'source-map-support/register';

import * as fs from 'fs';
import { join, basename } from 'path';
import { promisify } from 'util';

import Ajv from 'ajv';
import { get } from 'lodash';
import toJsonSchema from 'openapi-schema-to-json-schema';
import SwaggerParser from 'swagger-parser';
import { Spec } from 'swagger-schema-official';

import { getDirectories } from './FileUtils';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

// this is a command line script, it definitely uses the console
/* eslint-disable no-console */

const ajv = new Ajv({
	schemaId: 'id',
	unknownFormats: ['int32', 'float'],
	format: 'full',
	// do not log output from AJV, it goes to stderr and that makes rush test fail
	logger: false,
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

async function testOneSamplesDir(samplesPath: string, api: Spec) {
	let failures = 0;

	const sampleFolder = basename(samplesPath);
	const sampleFileNames = (await readdir(samplesPath)).filter((name) => name.endsWith('.json'));

	const oasModel = get(api, `components.schemas.${sampleFolder}`, null);
	if (!oasModel) {
		throw new Error(`Schema ${sampleFolder} does not exist.`);
	}

	const schema = toJsonSchema(oasModel);
	const validate = ajv.compile(schema);
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

async function testSamplesAgainstApi(apiPath: string, api: Spec) {
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
		const oasFile = join(rootDir, 'template-openapi.yaml');
		const api = await SwaggerParser.dereference(await SwaggerParser.parse(oasFile));

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
