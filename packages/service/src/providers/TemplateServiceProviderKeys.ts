import * as Ajv from 'ajv';

import {BindingKey} from '@loopback/context';

import {MinimalLogFactory} from '@sixriver/typescript-support';
import {ServiceDirectory} from '@sixriver/service-directory';
import {Validator} from '@sixriver/loopback4-support';

import {TemplateMessage} from '@sixriver/template-oas';


export namespace TemplateServiceProviderKeys {
	export const REQUEST_VALIDATOR = BindingKey.create<Validator<TemplateMessage, Ajv.ErrorObject>>(
		'template-message-validator');

	export const SERVICE_DIRECTORY = BindingKey.create<ServiceDirectory>('service-directory');
}
