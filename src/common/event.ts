export type Modifiers = {
	shift?: boolean;
	ctrl?: boolean;
	alt?: boolean;
	meta?: boolean;
};

export const getModifiers = (
	e: PointerEvent | MouseEvent | KeyboardEvent,
): Modifiers => ({
	shift: e.shiftKey,
	ctrl: e.ctrlKey,
	alt: e.altKey,
	meta: e.metaKey,
});

export const modifiersToString = (modifiers: Modifiers): string => {
	const keys = [];
	if (modifiers.ctrl || modifiers.meta) keys.push("C-");
	if (modifiers.alt) keys.push("A-");
	if (modifiers.shift) keys.push("S-");
	return keys.join();
};
