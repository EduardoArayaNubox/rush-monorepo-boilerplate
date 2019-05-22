import {TemplateServiceApplication} from './TemplateServiceApplication';
import {ApplicationConfig} from '@loopback/core';

export {TemplateServiceApplication};

// the main function is uninteresting for code coverage
/* istanbul ignore next */
export async function main(options?: ApplicationConfig) {
	const app = new TemplateServiceApplication({options});
	await app.boot();
	await app.start();
	return app;
}
