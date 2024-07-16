// -- Vec2D

/** 2D position */
export type Pos = {
	x: number;
	y: number;
};

/** Origin Pos. DO NOT USE IT DIRECTLY. instead, used {...ORIGIN} */
export const ORIGIN: Pos = { x: 0, y: 0 };

/**
 * Add two vectors.
 */
export const addPos = (a: Pos, b: Pos): Pos => ({
	x: a.x + b.x,
	y: a.y + b.y,
});

/**
 * Return the position on the line between a and b at r.
 * If r = 0, return a. If r = 1, return b.
 */
export const posOnLine = (a: Pos, b: Pos, r: number): Pos => ({
	x: a.x * (1 - r) + b.x * r,
	y: a.y * (1 - r) + b.y * r,
});

/**
 * Subtract two vectors.
 */
export const subPos = (a: Pos, b: Pos): Pos => ({
	x: a.x - b.x,
	y: a.y - b.y,
});

/**
 * Calculate norm of a vector.
 */
export const normPos = (p: Pos): number => Math.hypot(p.x, p.y);

// -- Linear Transforms

/**
 * Rotate and scale a 2D point.
 *
 * @param cos The cos of the angle.
 * @param sin The sin of the angle.
 * @param scale The scale factor.
 * @param p The point to transform.
 * @returns The transformed point.
 */
export const rotateScaleRaw2D = (
	cos: number,
	sin: number,
	scale: number,
	p: Pos,
): Pos => ({
	x: scale * (cos * p.x - sin * p.y),
	y: scale * (sin * p.x + cos * p.y),
});

/**
 * Rotate and scale a 2D point.
 *
 * @param angle The angle in radian.
 * @param scale The scale factor.
 * @param p The point to transform.
 * @returns The transformed point.
 */
export const rotateScale2D = (angle: number, scale: number, p: Pos): Pos =>
	rotateScaleRaw2D(Math.cos(angle), Math.sin(angle), scale, p);

// -- Size

/** 2D Size */
export type Size = {
	width: number;
	height: number;
};

/** 2D Rect */
export type Rect = Pos & Size;

/** Return true iff the position is in the given rectangle */
export const isPosInRect = (r: Rect, p: Pos): boolean =>
	p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height;

/** Return the center of boundary */
export const centerOfRect = (r: Rect): Pos => ({
	x: r.x + r.width / 2,
	y: r.y + r.height / 2,
});

/** Boundary */
export type Boundary = {
	left: number;
	right: number;
	top: number;
	bottom: number;
};

/** Empty boundary. DO NOT USE IT DIRECTLY. instead, used {...EMPTY_BOUNDARY} */
export const EMPTY_BOUNDARY: Boundary = {
	left: Infinity,
	right: -Infinity,
	top: Infinity,
	bottom: -Infinity,
};

/** Return true iff the position is in the boundary */
export const isPosInBoundary = (b: Boundary, p: Pos): boolean =>
	p.x >= b.left && p.x < b.right && p.y >= b.top && p.y < b.bottom;

/** Return the center of boundary */
export const centerOfBoundary = (b: Boundary): Pos => ({
	x: (b.left + b.right) / 2,
	y: (b.top + b.bottom) / 2,
});

/**
 * Extend the boundary to include the rect (x - r, y - r) - (x + r, y + r).
 * Inplace.
 */
export const extendBoundaryByRadius = (
	b: Boundary,
	x: number,
	y: number,
	r: number,
): Boundary => {
	b.left = Math.min(b.left, x - r);
	b.right = Math.max(b.right, x + r);
	b.top = Math.min(b.top, y - r);
	b.bottom = Math.max(b.bottom, y + r);
	return b;
};

/**
 * Extend the boundary to include the rect (x, y) - (x + 1, y + 1).
 * Inplace.
 */
export const extendBoundaryByPixel = (
	b: Boundary,
	x: number,
	y: number,
): Boundary => {
	b.left = Math.min(b.left, x);
	b.right = Math.max(b.right, x + 1);
	b.top = Math.min(b.top, y);
	b.bottom = Math.max(b.bottom, y + 1);
	return b;
};

/**
 * Extend the boundary to include the rect (x, y) - (x + w, y + h).
 * Inplace.
 */
export const extendBoundaryByRect = (b: Boundary, rect: Rect): Boundary => {
	b.left = Math.min(b.left, rect.x);
	b.right = Math.max(b.right, rect.x + rect.width);
	b.top = Math.min(b.top, rect.y);
	b.bottom = Math.max(b.bottom, rect.y + rect.height);
	return b;
};

/**
 * Limit the boundary to the origin rect (0, 0) - (w, h).
 */
export const limitBoundaryToOriginRect = (
	b: Boundary,
	w: number,
	h: number,
): Boundary => ({
	left: Math.max(0, b.left),
	right: Math.min(w, b.right),
	top: Math.max(0, b.top),
	bottom: Math.min(h, b.bottom),
});

export const rectToBoundary = (rect: Rect): Boundary => ({
	left: rect.x,
	right: rect.x + rect.width,
	top: rect.y,
	bottom: rect.y + rect.height,
});

export const boundaryToRect = (boundary: Boundary): Rect => ({
	x: boundary.left,
	y: boundary.top,
	width: boundary.right - boundary.left,
	height: boundary.bottom - boundary.top,
});
