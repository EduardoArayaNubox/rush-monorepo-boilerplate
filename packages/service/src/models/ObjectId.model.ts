import { Model, model, property } from '@loopback/repository';
import { ObjectId } from '@sixriver/template-oas';
import { KnownFieldsOnly } from '@sixriver/typescript-support';

@model()
export class ObjectIdModel extends Model implements KnownFieldsOnly<ObjectId> {
	@property({
		type: 'string',
		id: true,
		required: true,
	})
	id!: string;

	constructor(data?: Partial<ObjectIdModel>) {
		super(data);
	}
}
