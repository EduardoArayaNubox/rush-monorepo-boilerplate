// extract the JSONSchema4 type from the version of json-schema that the typescript converter uses
// ... via evil
import { compile } from 'json-schema-to-typescript';

type Function<T> = (arg: T, ...rest: any[]) => any;
type AnyFunction = (...args: any[]) => any;
type FirstArg<T extends AnyFunction> = T extends Function<infer Arg0> ? Arg0 : never;
export type JSONSchema4 = FirstArg<typeof compile>;
