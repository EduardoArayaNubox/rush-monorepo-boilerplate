import { Model, model, property } from '@loopback/repository';
import { TemplateMessage } from '@sixriver/template-oas';

// NOTE: the message is a `Model`, but _NOT_ an `Entity` -- it is not persisted
@model()
export class TemplateMessageModel extends Model implements TemplateMessage {
	@property({
		type: 'string',
		id: true,
		required: true,
		defaultFn: 'uuidv4',
	})
	id!: string;

	@property({
		type: 'object',
		required: false,
	})
	data?: object;

	constructor(data?: Partial<TemplateMessageModel>) {
		super(data);
	}
}
