import 'source-map-support/register';
import { ApplicationConfig } from '@loopback/core';
import { CommonBindings } from '@sixriver/loopback4-support';

import { TemplateServiceApplication } from './TemplateServiceApplication';

export { TemplateServiceApplication };

// the main function is uninteresting for code coverage
/* istanbul ignore next */
async function main(options?: ApplicationConfig): Promise<void> {
	const app = new TemplateServiceApplication({ options });
	await app.boot();
	if (process.argv.includes('--init-only')) {
		const logger = await app.get(CommonBindings.ROOT_LOGGER);
		logger.info('Running in init container mode, exiting after successful database migration');
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
