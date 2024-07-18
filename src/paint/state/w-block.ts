import { Accessor, Setter, createSignal } from "solid-js";

/** An object with UI blocking signal */
export type WithBlockSignal = {
	/** Whether UI is blocked. */
	blocked: Accessor<boolean | undefined>;
	uiBlocked: Setter<boolean | undefined>;
};

/**
 * Install block signal to the target object.
 */
export const installBlockSignal = <T extends object>(
	target: T,
): T & WithBlockSignal => {
	const [blocked, uiBlocked] = createSignal<boolean | undefined>();
	return Object.assign(target, {
		blocked,
		uiBlocked,
	});
};
