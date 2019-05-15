import * as fs from 'fs';
import {join} from 'path';
import {promisify} from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export async function getDirectories(path: string): Promise<string[]> {
	const dirItems = await readdir(path);
	const filtered = await Promise.all(dirItems.map(
		async (f) => (await stat(join(path, f))).isDirectory() ? f : ''));
	return filtered.filter((f) => !!f);
}
