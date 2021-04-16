import { ApplicationConfig } from '@loopback/core';

import { TemplateServiceApplication } from './TemplateServiceApplication';

export { TemplateServiceApplication };

// the main function is uninteresting for code coverage
/* istanbul ignore next */
export async function main(options?: ApplicationConfig) {
	const app = new TemplateServiceApplication({ options });
	await app.boot();
	if (process.argv.includes('--init-only')) {
		app['logger']?.info(
			'Running in init container mode, exiting after successful database migration',
		);
		// FIXME: there's gotta be a better way to do this
		process.exit(0);
	}
	await app.start();
	return app;
}
