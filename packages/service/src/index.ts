import 'source-map-support/register';
import { ApplicationConfig } from '@loopback/core';

import { TemplateServiceApplication } from './TemplateServiceApplication';

export { TemplateServiceApplication };

// the main function is uninteresting for code coverage
/* istanbul ignore next */
async function main(options?: ApplicationConfig): Promise<void> {
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
}

/* istanbul ignore next */
if (require.main === module) {
	// Run the application
	main().catch((err) => {
		// eslint-disable-next-line no-console
		console.error('Cannot start the application.', err);
		process.exit(1);
	});
}
