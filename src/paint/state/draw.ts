/**
 * @module draw
 * @description Draw helpers for PaintState
 */

import {
	Pos,
	boundaryToRect,
	extendBoundaryByRect,
	EMPTY_BOUNDARY,
} from "@/common";

import {
	drawLineWithCallbacks,
	ellipsePolygon,
	polygonTo4SegPath2D,
	polygonToPath2D,
} from "../polygon";

import {
	PaintState,
	contextUseToolStyle,
	getBrush,
	getBrushPos,
	getTempLayerCtx,
} from ".";

/**
 * Draw a brush shape at the given position.
 */
export const drawSingleBrush = (z: PaintState, x: number, y: number) => {
	const ctx = getTempLayerCtx(z);
	const brush = getBrush(z);

	ctx.save();
	contextUseToolStyle(z, ctx);
	ctx.translate(x, y);
	ctx.fill(polygonToPath2D(brush.shape));
	ctx.restore();
};

const drawBrushLine = (
	z: PaintState,
	ctx: CanvasRenderingContext2D,
	sx: number,
	sy: number,
	ex: number,
	ey: number,
) => {
	const brush = getBrush(z);
	const shape = brush.shape;
	const brushRect = boundaryToRect(shape.bd);

	let lx = 0,
		ly = 0;

	drawLineWithCallbacks(
		sx,
		sy,
		ex,
		ey,
		(x, y, l) => {
			ctx.translate(x - lx, y - ly);
			(lx = x), (ly = y);
			ctx.fill(polygonTo4SegPath2D(brush.shape, l - 1, 0));
			z.tempBd = extendBoundaryByRect(z.tempBd, {
				x: x + brushRect.x,
				y: y + brushRect.y,
				w: l - 1 + brushRect.w,
				h: brushRect.h,
			});
		},
		(y, x, l) => {
			ctx.translate(x - lx, y - ly);
			(lx = x), (ly = y);
			ctx.fill(polygonTo4SegPath2D(brush.shape, 0, l - 1));
			z.tempBd = extendBoundaryByRect(z.tempBd, {
				x: x + brushRect.x,
				y: y + brushRect.y,
				w: brushRect.w,
				h: l - 1 + brushRect.h,
			});
		},
	);
};

/**
 * Draw a middle of freedraw lines.
 */
const drawFree = (z: PaintState, x: number, y: number) => {
	const ctx = getTempLayerCtx(z);

	const lastX = Math.floor(z.ptrState!.last.x),
		lastY = Math.floor(z.ptrState!.last.y);

	const dx = x - lastX;
	const dy = y - lastY;

	if (dx * dx + dy * dy < 1.4) return;

	z.ptrState!.last = { x, y };

	ctx.save();
	contextUseToolStyle(z, ctx);
	drawBrushLine(z, ctx, lastX, lastY, Math.floor(x), Math.floor(y));
	ctx.restore();
};

const drawRect = (
	z: PaintState,
	pos: Pos,
	fill?: boolean,
	ellipse?: boolean,
) => {
	const start = z.ptrState!.start;
	const last = z.ptrState!.last;

	const sx = Math.floor(start.x),
		sy = Math.floor(start.y);
	const lx = Math.floor(last.x),
		ly = Math.floor(last.y);
	const px = Math.floor(pos.x),
		py = Math.floor(pos.y);

	if (px === lx && py === ly) return;

	const bd = z.tempBd;

	// Clear the previous rectangle
	const ctx = getTempLayerCtx(z);
	ctx.clearRect(bd.l, bd.t, bd.r - bd.l + 1, bd.b - bd.t + 1);

	// Draw the new rectangle
	ctx.save();
	contextUseToolStyle(z, ctx);
	z.tempBd = {
		l: Math.min(sx, px),
		r: Math.max(sx, px) + 1,
		t: Math.min(sy, py),
		b: Math.max(sy, py) + 1,
	};
	if (fill) {
		if (ellipse) {
			// Clip
			const poly = ellipsePolygon(
				z.tempBd.l,
				z.tempBd.t,
				z.tempBd.r - z.tempBd.l,
				z.tempBd.b - z.tempBd.t,
			);
			ctx.clip(polygonToPath2D(poly));
		}
		ctx.fillRect(
			z.tempBd.l,
			z.tempBd.t,
			z.tempBd.r - z.tempBd.l,
			z.tempBd.b - z.tempBd.t,
		);
	} else {
		const brush = getBrush(z),
			lw = Math.max(brush.size.w, brush.size.h);
		ctx.lineWidth = lw;
		const off = lw / 2 - Math.floor(lw / 2);
		ctx.strokeRect(
			z.tempBd.l + off,
			z.tempBd.t + off,
			z.tempBd.r - z.tempBd.l - 1,
			z.tempBd.b - z.tempBd.t - 1,
		);
		z.tempBd.l -= lw;
		z.tempBd.r += lw;
		z.tempBd.t -= lw;
		z.tempBd.b += lw;
	}
	ctx.restore();

	z.ptrState!.last = { ...pos };
};

const drawLine = (z: PaintState, pos: Pos) => {
	const start = z.ptrState!.start;
	const last = z.ptrState!.last;

	const sx = Math.floor(start.x),
		sy = Math.floor(start.y);
	const lx = Math.floor(last.x),
		ly = Math.floor(last.y);
	const px = Math.floor(pos.x),
		py = Math.floor(pos.y);

	if (px === lx && py === ly) return;

	const bd = z.tempBd;

	// Clear the previous line
	const ctx = getTempLayerCtx(z);
	ctx.clearRect(bd.l, bd.t, bd.r - bd.l + 1, bd.b - bd.t + 1);

	z.tempBd = { ...EMPTY_BOUNDARY };

	// Draw the new line
	ctx.save();
	contextUseToolStyle(z, ctx);
	drawBrushLine(z, ctx, sx, sy, px, py);
	ctx.restore();

	z.ptrState!.last = { ...pos };
};

/** Draw if pointer is down */
export const drawIfPointerDown = (z: PaintState) => {
	if (!z.ptrState) return;

	const pos = getBrushPos(z);

	const shape = z.drawShape();

	switch (shape) {
		case "free":
			drawFree(z, pos.x, pos.y);
			break;
		case "rect":
			drawRect(z, pos);
			break;
		case "fillRect":
			drawRect(z, pos, true);
			break;
		case "ellipse":
			drawRect(z, pos, true, true);
			break;
		case "fillEllipse":
			drawRect(z, pos, true, true);
			break;
		case "line":
			drawLine(z, pos);
			break;
	}
};
