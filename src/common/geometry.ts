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
 * Extend the boundary to include the rect (x - r, y - r) - (x + r, y + r).
 * Inplace.
 */
export const extendBoundaryByRadius = (
	b: Boundary,
	x: number,
	y: number,
	r: number,
): Boundary => {
	b.l = Math.min(b.l, x - r);
	b.r = Math.max(b.r, x + r);
	b.t = Math.min(b.t, y - r);
	b.b = Math.max(b.b, y + r);
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
	b.l = Math.min(b.l, x);
	b.r = Math.max(b.r, x + 1);
	b.t = Math.min(b.t, y);
	b.b = Math.max(b.b, y + 1);
	return b;
};

/**
 * Extend the boundary to include the rect (x, y) - (x + w, y + h).
 * Inplace.
 */
export const extendBoundaryByRect = (b: Boundary, rect: Rect): Boundary => {
	b.l = Math.min(b.l, rect.x);
	b.r = Math.max(b.r, rect.x + rect.w);
	b.t = Math.min(b.t, rect.y);
	b.b = Math.max(b.b, rect.y + rect.h);
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
