import { Accessor, Setter, createSignal } from "solid-js";

import { ORIGIN, Pos } from "@/common";

import { Cursor } from "..";

/** An object contains signal of brush set */
export type WithCursorSignal = {
	/** Getter for Cursor */
	cursor: Accessor<Cursor>;

	/** Setter for Cursor */
	setCursor: Setter<Cursor>;

	ptrState?: {
		start: Pos;
		last: Pos;
	};
};

/** Install WithCursorSignal to the object. */
export const installCursorSignal = <T extends object>(
	target: T,
): T & WithCursorSignal => {
	const [cursor, setCursor] = createSignal({
		real: ORIGIN,
		brush: ORIGIN,
	});
	return Object.assign(target, { cursor, setCursor });
};

/**
 * Update only real cursor position.
 */
export const updateRealCursorPos = (
	z: WithCursorSignal,
	x: number,
	y: number,
) => {
	z.setCursor(c => ({ ...c, real: { x, y } }));
};
