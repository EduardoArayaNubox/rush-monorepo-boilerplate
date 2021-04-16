import { JsonSchema } from '@sixriver/oas-support';

// exports from this file will be wrapped up so the top level export is TemplateSchemas

// import syntax can't set the value types for these
/* eslint-disable @typescript-eslint/no-var-requires */

export const TemplateMessageSchema: JsonSchema = require('../schemas/TemplateMessage.json');
