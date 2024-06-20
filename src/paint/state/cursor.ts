import { Accessor, Setter, createSignal } from "solid-js";

import { ORIGIN, Pos, addPos } from "@/common";

import { Cursor } from "..";

/** An object contains signal of brush set */
export type WithCursorSignal = {
	/** Getter for Cursor */
	cursor: Accessor<Cursor>;

	/** Setter for Cursor */
	setCursor: Setter<Cursor>;
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
 * Update both real and brush cursor position.
 */
export const updateAllCursorPos = (z: WithCursorSignal, pos: Pos) => {
	z.setCursor(c => ({ ...c, real: { ...pos }, brush: { ...pos } }));
};

/**
 * Update only real cursor position.
 */
export const updateRealCursorPos = (z: WithCursorSignal, pos: Pos) => {
	z.setCursor(c => ({ ...c, real: { ...pos } }));
};

/**
 * Translate real cursor position.
 */
export const moveRealCursorPos = (z: WithCursorSignal, delta: Pos) => {
	z.setCursor(c => ({ ...c, real: addPos(c.real, delta) }));
};
