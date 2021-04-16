// extract the JSONSchema4 type from the version of json-schema that the typescript converter uses
// ... via evil
import { compile } from 'json-schema-to-typescript';

type Func<T> = (arg: T, ...rest: any[]) => unknown;
type AnyFunc = (...args: any[]) => unknown;
type FirstArg<T extends AnyFunc> = T extends Func<infer Arg0> ? Arg0 : never;
export type JSONSchema4 = FirstArg<typeof compile>;
