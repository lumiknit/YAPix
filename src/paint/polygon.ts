/**
 * @module polygon.ts
 * @description This module provide 'polygon' which can be used to draw on canvas or export to svg.
 */

export type Polygon = {
	points: [number, number][];
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;

	path2D?: Path2D;
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
		minX: Infinity,
		minY: Infinity,
		maxX: -Infinity,
		maxY: -Infinity,
	};
	for (const [x, y] of points) {
		p.minX = Math.min(p.minX, x);
		p.minY = Math.min(p.minY, y);
		p.maxX = Math.max(p.maxX, x);
		p.maxY = Math.max(p.maxY, y);
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
	const cx = (p.minX + p.maxX) / 2;
	const cy = (p.minY + p.maxY) / 2;
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
	const p: number[] = [],
		q: number[] = [];
	// Calculate widths
	const xb = (w - 1) / 2 + x,
		cy = (h - 1) / 2,
		a = w / 2 - 0.1,
		b = h / 2 - 0.1;
	for (let py = 0; py < b; py++) {
		const dy = (py - cy) / b,
			w2 = Math.sqrt(1 - dy * dy) * a,
			left = Math.ceil(xb - w2),
			right = Math.floor(xb + w2) + 1;
		p.push(left, right);
		q.push(right, left);
	}
	// Copy the reversed list
	if (h % 2 == 1) q.splice(q.length - 2);
	q.reverse();
	p.push(...q);
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
	vertical: (x: number, y: number, l: number) => void,
) => {
	if (x0 == x1) {
		// Just draw a vertical line
		const y = Math.min(y0, y1);
		const l = Math.abs(y1 - y0) + 1;
		vertical(x0, y, l);
		return;
	}

	const w = Math.abs(x1 - x0);
	const h = Math.abs(y1 - y0);

	if (w >= h) {
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
			console.log("Int", x, y, err);
			if (err < 0) {
				err += de;
			} else {
				console.log("h-draw", last, y, x - last + 1);
				horizontal(last, y, x - last + 1);
				last = x + 1;
				err += dne;
				y += sy;
			}
		}
		if (err < de && x > last) {
			console.log("h-draw", last, y, x - last);
			horizontal(last, y, x - last);
		}
	} else {
		if (y0 > y1) {
			// Swap the points
			[x0, x1] = [x1, x0];
			[y0, y1] = [y1, y0];
		}

		let x = x0,
			y = y0;

		const sx = x1 > x0 ? 1 : -1;

		let err = 2 * w - h;
		const de = 2 * w;
		const dne = 2 * (w - h);

		let last = y;
		for (; y <= y1; y++) {
			console.log("Int", x, y, err);
			if (err < 0) {
				err += de;
			} else {
				console.log("v-draw", last, y, y - last + 1);
				vertical(x, last, y - last + 1);
				last = y + 1;
				err += dne;
				x += sx;
			}
		}
		if (err < de && y > last) {
			console.log("v-draw", last, y, y - last);
			vertical(x, last, y - last);
		}
	}
};
