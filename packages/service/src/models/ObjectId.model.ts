import { Model, model, property } from '@loopback/repository';
import { ObjectId } from '@sixriver/template-oas';

@model()
export class ObjectIdModel extends Model implements ObjectId {
	@property({
		type: 'string',
		id: true,
		required: true,
	})
	id!: string;

	constructor(data?: Partial<ObjectIdModel>) {
		super(data);
	}

	[k: string]: unknown;
}
