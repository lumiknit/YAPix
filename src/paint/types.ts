/** 2D position */
export type Pos = {
	x: number;
	y: number;
};

/** Origin Pos. DO NOT USE IT DIRECTLY. instead, used {...ORIGIN} */
export const ORIGIN: Pos = { x: 0, y: 0 };

/** 2D Size */
export type Size = {
	w: number;
	h: number;
};

/** 2D Rect */
export type Rect = Pos & Size;

/** Display */
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
