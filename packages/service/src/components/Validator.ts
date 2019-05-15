export interface Validator<T, TError = any> {
	/**
	 * Check if an object is valid.
	 * @param object object to inspect
	 * @returns true if it is valid, else an array of errors
	 */
	tryValidate(object: T): Promise<true | TError[]>;
}
