/**
 * @module polygon.ts
 * @description This module provide 'polygon' which can be used to draw on canvas or export to svg.
 */

import { Boundary, EMPTY_BOUNDARY, extendBoundaryByRadius } from "@/common";

/**
 * Polygon type for both of canvas2D and svg.
 */
export type Polygon = {
	/** Point positions */
	points: [number, number][];

	/** Boundary contains min/max position of points */
	bd: Boundary;

	// Cached objects

	/** Path2D */
	path2D?: Path2D;

	/** SVG points string */
	svg?: string;
};

/**
 * Create a polygon
 *
 * @param points The points of the polygon
 */
export const polygon = (points: [number, number][]): Polygon => {
	const p: Polygon = {
		points,
		bd: { ...EMPTY_BOUNDARY },
	};
	for (const [x, y] of points) {
		extendBoundaryByRadius(p.bd, x, y, 0);
	}
	return p;
};

/**
 * Convert a polygon to a path2D
 *
 * @param p The polygon
 */
export const polygonToPath2D = (p: Polygon): Path2D => {
	if (!p.path2D) {
		const path = new Path2D();
		const [x0, y0] = p.points[0];
		path.moveTo(x0, y0);
		for (let i = 1; i < p.points.length; i++) {
			const [x, y] = p.points[i];
			path.lineTo(x, y);
		}
		path.closePath();
		p.path2D = path;
	}
	return p.path2D;
};

/**
 * Convert a polygon into Path2D with 4-segments
 */
export const polygonTo4SegPath2D = (
	p: Polygon,
	w: number,
	h: number,
): Path2D => {
	const path = new Path2D();
	const cx = (p.bd.l + p.bd.r) / 2;
	const cy = (p.bd.t + p.bd.b) / 2;
	const [x0, y0] = p.points[0];
	path.moveTo(x0, y0);
	for (let i = 1; i < p.points.length; i++) {
		let [x, y] = p.points[i];
		if (x > cx) x += w;
		if (y > cy) y += h;
		path.lineTo(x, y);
	}
	path.closePath();
	return path;
};

/**
 * Convert a polygon to a svg.
 *
 * @param p The polygon
 * @return The points string for polygon tag. (Use as <polygon points="..." />)
 */
export const polygonToSVG = (p: Polygon): string => {
	if (!p.svg) {
		p.svg = p.points.map(([x, y]) => `${x},${y}`).join(" ");
	}
	return p.svg;
};

// -- Pixel-perfect path helpers

/**
 * Pixels [x, x'] list to a polygon.
 * The xs contains the sequence of x start and end position.
 * For example, [x0, x'0, x1, x'1, ...] means pixels on [x0, x'0] on y=0, [x1, x'1] on y=1, ...
 *
 * @param xs The list of x start and end position. The length of the list must be even.
 * @param y0 The top y-coordinate of the polygon
 * @return The polygon
 */
export const xsToPolygon = (xs: number[], y0: number): Polygon => {
	const left: [number, number][] = [];
	const right: [number, number][] = [];
	const h = xs.length / 2;
	// Push the first point
	left.push([xs[0], y0]);
	right.push([xs[1], y0]);
	let lastL = xs[0],
		lastR = xs[1];
	// Push the left side
	for (let i = 1; i < h; i++) {
		const l = xs[i * 2],
			r = xs[i * 2 + 1];
		if (lastL != l) {
			left.push([lastL, y0 + i], [l, y0 + i]);
			lastL = l;
		}
		if (lastR != r) {
			right.push([lastR, y0 + i], [r, y0 + i]);
			lastR = r;
		}
	}
	left.push([lastL, y0 + h]);
	right.push([lastR, y0 + h]);
	right.reverse();
	return polygon(left.concat(right));
};

/**
 * Create a rectangle
 *
 * @param x The x-coordinate of the top-left corner of the rectangle
 * @param y The y-coordinate of the top-left corner of the rectangle
 * @param w The width of the rectangle
 * @param h The height of the rectangle
 */
export const rectanglePolygon = (
	x: number,
	y: number,
	w: number,
	h: number,
): Polygon =>
	polygon([
		[x, y],
		[x + w, y],
		[x + w, y + h],
		[x, y + h],
	]);

/**
 * Create a quad with the given points
 */
export const ellipsePixels = (w: number, h: number): number[] => {
	const xs = [];
	const cy = (h - 1) / 2,
		a = w / 2 - 0.1,
		b = h / 2 - 0.1,
		zig = w % 2;
	for (let py = 0; py < b; py++) {
		const dy = (py - cy) / b,
			w2 = Math.sqrt(1 - dy * dy) * a;
		xs.push(Math.round(w2 + zig / 2) * 2 - zig);
	}
	const t = xs.slice(0, xs.length - (h % 2));
	t.reverse();
	return xs.concat(t);
};

/**
 * Create an ellipse
 *
 * @param x The x-coordinate of the top-left corner of the rectangle
 * @param y The y-coordinate of the top-left corner of the rectangle
 * @param w The width of the rectangle
 * @param h The height of the rectangle
 */
export const ellipsePolygon = (
	x: number,
	y: number,
	w: number,
	h: number,
): Polygon => {
	const pxs = ellipsePixels(w, h);
	const p: number[] = [];
	for (let i = 0; i < pxs.length; i++) {
		const m = w - pxs[i];
		p.push(x + m / 2, x + w - m / 2);
	}
	return xsToPolygon(p, y);
};

/**
 * Draw a pixel-perfect line with the given callback.
 * The callback is called when a single pixel rectangle is drawn.
 * The algorithm is based on Bresenham's line algorithm.
 *
 * @param x0 The x-coordinate of the start point. Should be int
 * @param y0 The y-coordinate of the start point. Should be int
 * @param x1 The x-coordinate of the end point. Should be int
 * @param y1 The y-coordinate of the end point. Should be int
 * @param horizontal The callback to draw a horizontal line
 * @param vertical The callback to draw a vertical line
 */
export const drawLineWithCallbacks = (
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	horizontal: (x: number, y: number, l: number) => void,
	vertical: (y: number, x: number, l: number) => void,
) => {
	let f = horizontal;
	if (Math.abs(y1 - y0) > Math.abs(x1 - x0)) {
		// Swap
		[x0, y0, x1, y1] = [y0, x0, y1, x1];
		f = vertical;
	}

	const w = Math.abs(x1 - x0);
	const h = Math.abs(y1 - y0);

	if (x0 > x1) {
		// Swap the points
		[x0, x1] = [x1, x0];
		[y0, y1] = [y1, y0];
	}

	let x = x0,
		y = y0;

	const sy = y1 > y0 ? 1 : -1;

	let err = 2 * h - w;
	const de = 2 * h;
	const dne = 2 * (h - w);

	let last = x;
	for (; x <= x1; x++) {
		if (err < 0) {
			err += de;
		} else {
			f(last, y, x - last + 1);
			last = x + 1;
			err += dne;
			y += sy;
		}
	}
	if (err < de && x > last) {
		f(last, y, x - last);
	}
};

const _cached_brush_pixels: Map<number, number[]> = new Map();

/**
 * Draw a pixel-perfect line with the given callback.
 * The callback is called when a single pixel rectangle is drawn.
 * The algorithm is based on Bresenham's line algorithm.
 *
 * @param x0 The x-coordinate of the start point.
 * @param y0 The y-coordinate of the start point.
 * @param x1 The x-coordinate of the end point.
 * @param y1 The y-coordinate of the end point.
 * @param strokeWidth The width of the stroke
 * @param shape The shape of the stroke
 * @param fillRect The callback to draw a rectangle
 */
export const drawLineWithCallbacksV2 = (
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	strokeWidth: number,
	shape: "round" | "square",
	fillRect: (x: number, y: number, w: number, h: number) => void,
) => {
	// Convert to brush top left positions
	const hsw = (strokeWidth - 1) / 2;
	x0 = Math.floor(x0 - hsw);
	y0 = Math.floor(y0 - hsw);
	x1 = Math.floor(x1 - hsw);
	y1 = Math.floor(y1 - hsw);

	const idx = shape === "round" ? strokeWidth : -strokeWidth;
	if (!_cached_brush_pixels.has(idx)) {
		if (_cached_brush_pixels.size > 16) {
			_cached_brush_pixels.delete(_cached_brush_pixels.keys().next().value);
		}
		_cached_brush_pixels.set(
			idx,
			idx > 0
				? ellipsePixels(strokeWidth, strokeWidth)
				: Array(Math.round(strokeWidth)).fill(strokeWidth),
		);
	}
	const xs = _cached_brush_pixels.get(idx)!;

	let w = Math.abs(x1 - x0),
		h = Math.abs(y1 - y0),
		f = fillRect;

	// Swap to w > h
	if (h > w) {
		// Swap
		[x0, y0, x1, y1] = [y0, x0, y1, x1];
		[w, h] = [h, w];
		f = (y, x, h, w) => fillRect(x, y, w, h);
	}

	const a = h / w;

	// Swap to x0 < x1
	if (x0 > x1) {
		[x0, x1, y0, y1] = [x1, x0, y1, y0];
	}

	if (y0 === y1) {
		// In this case, just draw a horizontal line
		if (shape === "square") {
			f(x0, y0, x1 + strokeWidth - x0, strokeWidth);
		} else {
			for (let y = 0; y < strokeWidth; y++) {
				const l = xs[y];
				const x = x0 + (strokeWidth - l) / 2;
				f(x, y0 + y, w + l, 1);
			}
		}
		return;
	}

	const sgn = Math.sign(y1 - y0);

	// err is the distance between (x, y) the next horizontal grid y=ceil(y), where x is the center of pixel.
	// If err >= 1, the line passed to the next y.

	let topX = 0,
		topY = 0;
	{
		// Find the top position
		let maxv = -Infinity;
		for (let y = 0; y < strokeWidth / 2; y++) {
			// Most right ptr
			const x = (strokeWidth + xs[y]) / 2 - 1,
				v = a * x - y;
			if (v > maxv) {
				maxv = v;
				topX = x;
				topY = y;
			}
		}
	}
	const botY = strokeWidth - 1 - topY;

	let tx = 0,
		bx = 0;
	let terr = 0.5 - a,
		berr = 0.5 - a;

	const yBase = sgn > 0 ? y0 : y0 + strokeWidth - 1;

	for (let py = 0; py < strokeWidth + h; py++) {
		const dy = py - h,
			lp = xs[py],
			ld = xs[dy];

		// Calculate the next bx
		if (py <= botY) {
			bx = x0 + (strokeWidth - lp) / 2;
		} else if (dy > botY) {
			bx = x1 + (strokeWidth - ld) / 2;
		} else {
			const n = 1 + Math.max(0, Math.ceil(berr / a));
			bx += n;
			berr += 1 - n * a;
		}

		// Calculate the next tx
		if (py < topY) {
			tx = x0 + (strokeWidth + lp) / 2;
		} else if (dy >= topY) {
			tx = x1 + (strokeWidth + ld) / 2;
		} else {
			if (py === topY) tx = x0 + topX;
			const n = 1 + Math.max(0, Math.ceil(terr / a));
			tx += n;
			terr += 1 - n * a;
		}

		// Draw a scan line
		f(bx, yBase + sgn * py, tx - bx, 1);
	}
};
