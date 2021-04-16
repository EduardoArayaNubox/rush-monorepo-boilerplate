import { BindingKey } from '@loopback/context';
import { ServiceDirectory } from '@sixriver/service-directory';
import { TemplateMessage } from '@sixriver/template-oas';
import { Validator } from '@sixriver/typescript-support';
import Ajv from 'ajv';

export namespace TemplateServiceProviderKeys {
	export const REQUEST_VALIDATOR = BindingKey.create<Validator<TemplateMessage, Ajv.ErrorObject>>(
		'template-message-validator',
	);

	export const SERVICE_DIRECTORY = BindingKey.create<ServiceDirectory>('service-directory');
}
