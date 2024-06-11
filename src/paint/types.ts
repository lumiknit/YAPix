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

/** Empty boundary. DO NOT USE IT DIRECTLY. instead, used {...EMPTY_BOUNDARY} */
export const EMPTY_BOUNDARY = {
	l: Infinity,
	r: -Infinity,
	t: Infinity,
	b: -Infinity,
};

/**
 * Extend the boundary to include the rect (x - r, y - r) - (x + r, y + r)
 */
export const extendBoundaryByRadius = (
	b: Boundary,
	x: number,
	y: number,
	r: number,
): Boundary => ({
	l: Math.min(b.l, x - r),
	r: Math.max(b.r, x + r),
	t: Math.min(b.t, y - r),
	b: Math.max(b.b, y + r),
});

/**
 * Extend the boundary to include the rect (x, y) - (x + w, y + h)
 */
export const extendBoundaryByRect = (b: Boundary, rect: Rect): Boundary => ({
	l: Math.min(b.l, rect.x),
	r: Math.max(b.r, rect.x + rect.w),
	t: Math.min(b.t, rect.y),
	b: Math.max(b.b, rect.y + rect.h),
});

/**
 * Limit the boundary to the origin rect (0, 0) - (w, h).
 */
export const limitBoundaryToOriginRect = (
	b: Boundary,
	w: number,
	h: number,
): Boundary => ({
	l: Math.max(0, b.l),
	r: Math.min(w, b.r),
	t: Math.max(0, b.t),
	b: Math.min(h, b.b),
});

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

/** Cursor */
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

/** Tool Type */
export type ToolType =
	| "brush"
	| "eraser"
	| "select"
	| "deselect"
	| "move"
	| "zoom"
	| "spoid";

export const ERASER_TYPE_TOOLS: Set<ToolType> = new Set(["eraser", "deselect"]);

/** Draw shape */
export type DrawShape =
	| "free"
	| "rect"
	| "fillRect"
	| "ellipse"
	| "fillEllipse"
	| "line"
	| "fill";
