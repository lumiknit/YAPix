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

/** Boundary */
export type Boundary = {
	l: number;
	r: number;
	t: number;
	b: number;
};

export const rectToBoundary = (rect: Rect): Boundary => ({
	l: rect.x,
	r: rect.x + rect.w,
	t: rect.y,
	b: rect.y + rect.h,
});

export const boundaryToRect = (boundary: Boundary): Rect => ({
	x: boundary.l,
	y: boundary.t,
	w: boundary.r - boundary.l,
	h: boundary.b - boundary.t,
});

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
