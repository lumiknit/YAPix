export class AppWrap<T> {
	value: T;

	constructor(value: T) {
		this.value = value;
	}

	app<U>(fn: (value: T) => U): AppWrap<U> {
		return new AppWrap(fn(this.value));
	}
}
