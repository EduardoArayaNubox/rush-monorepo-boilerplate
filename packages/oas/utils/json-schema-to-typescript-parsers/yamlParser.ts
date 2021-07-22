import { FileInfo, ParserError } from '@apidevtools/json-schema-ref-parser';
import { SchemaObject } from 'ajv';
import { load } from 'js-yaml';

import { applyDateFormat } from '../applyDateFormat';

// NOTE: this is the json parser copied from v9.0.9 of json-schema-ref-parser (and modified) since it is not exported
// https://github.com/APIDevTools/json-schema-ref-parser/blob/v9.0.9/lib/parsers/yaml.js
export const YamlParser = {
	/**
	 * The order that this parser will run, in relation to other parsers.
	 *
	 * @type {number}
	 */
	order: 200,

	/**
	 * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
	 *
	 * @type {boolean}
	 */
	allowEmpty: true,

	/**
	 * Determines whether this parser can parse a given file reference.
	 * Parsers that match will be tried, in order, until one successfully parses the file.
	 * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
	 * every parser will be tried.
	 *
	 * @type {RegExp|string[]|function}
	 */
	canParse: ['.yaml', '.yml', '.json'], // JSON is valid YAML

	/**
	 * Parses the given file as YAML
	 *
	 * @param {object} file           - An object containing information about the referenced file
	 * @param {string} file.url       - The full URL of the referenced file
	 * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
	 * @param {*}      file.data      - The file contents. This will be whatever data type was returned by the resolver
	 * @returns {Promise}
	 */
	async parse(file: FileInfo): Promise<unknown> {
		let data = file.data;
		if (Buffer.isBuffer(data)) {
			data = data.toString();
		}

		let parsed: string | number | object | null | undefined;

		if (typeof data === 'string') {
			try {
				parsed = load(data);
			} catch (e) {
				throw new ParserError(e.message, file.url);
			}
		} else {
			// data is already a JavaScript value (object, array, number, null, NaN, etc.)
			parsed = data;
		}

		if (parsed) {
			return applyDateFormat(parsed as SchemaObject);
		}

		return parsed;
	},
};
