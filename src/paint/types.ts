export type Pos = {
	x: number;
	y: number;
};

export const ORIGIN = { x: 0, y: 0 };

export type Size = {
	w: number;
	h: number;
};

export type Rect = Pos & Size;

export type Display = Pos & {
	zoom: number;
};

// Cursors

export type Cursor = {
	/**
	 * Real cursor position
	 */
	real: Pos;

	/**
	 * Brush position.
	 * If brush stabilization is enabled, this value is different from the real cursor position.
	 */
	brush: Pos;
};
