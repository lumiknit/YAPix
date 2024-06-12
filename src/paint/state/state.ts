import {
	AppWrap,
	Boundary,
	EMPTY_BOUNDARY,
	boundaryToRect,
	extendBoundaryByRect,
	extractCanvasRect,
	limitBoundaryToOriginRect,
	putContextToContext,
} from "@/common";
import toast from "solid-toast";

import { HistoryManager } from "../action-history";
import { Action, UpdateImgAction } from "../actions";

import { ERASER_TYPE_TOOLS, PaintConfig } from "..";
import {
	drawLineWithCallbacks,
	polygonTo4SegPath2D,
	polygonToPath2D,
} from "../polygon";

import { WithBrushSetSignal, installBrushSetSignal } from "./brush";
import {
	clearTempLayer,
	contextUseToolStyle,
	getBrush,
	getBrushPos,
	updateBrushCursorPos,
} from "./composition";
import { WithConfigSignal, installConfigSignal } from "./config";
import { WithCursorSignal, installCursorSignal } from "./cursor";
import {
	WithDisplaySignal,
	fitDisplayTo,
	installDisplaySignal,
} from "./display";
import {
	WithImageInfo,
	installImageInfo,
	renderBlurredLayer,
} from "./image-info";
import { WithPaletteSignal, installPaletteSignal } from "./palette";
import { WithToolSettingsSignal, installToolSettingsSignal } from "./tool";
import {
	WithUIInfo,
	getFocusedLayerCtx,
	getTempLayerCtx,
	installUIInfo,
} from "./ui";

export type PaintState = WithBrushSetSignal &
	WithConfigSignal &
	WithCursorSignal &
	WithDisplaySignal &
	WithImageInfo &
	WithPaletteSignal &
	WithToolSettingsSignal &
	WithUIInfo & {
		history: HistoryManager<Action>;

		tempBd: Boundary;

		lastStepMS: number;
	};

export const createPaintState = (
	cfg: PaintConfig,
	w: number,
	h: number,
): PaintState => {
	const z = new AppWrap({})
		.app(installConfigSignal(cfg))
		.app(installBrushSetSignal)
		.app(installCursorSignal)
		.app(installDisplaySignal)
		.app(installImageInfo(w, h))
		.app(installPaletteSignal)
		.app(installToolSettingsSignal)
		.app(installUIInfo).value;
	return Object.assign(z, {
		history: new HistoryManager<Action>(
			z.config().maxHistory,
			a => revertAction(z as any, a),
			a => execAction(z as any, a),
		),
		tempBd: { ...EMPTY_BOUNDARY },
		lastStepMS: Date.now(),
	});
};

/**
 * Initialize the paint state.
 * This may be called in onMount.
 */
export const initPaintState = (z: PaintState) => {
	// Update the background layer
	const below = z.belowLayerRef!.getContext("2d")!;
	const above = z.aboveLayerRef!.getContext("2d")!;
	renderBlurredLayer(z, z.config().bgCheckerboard, below, above);

	// Fit the display
	fitCanvasToRoot(z);
};

export const fitCanvasToRoot = (z: PaintState) => {
	const root = z.rootRef!;
	fitDisplayTo(z, root.offsetWidth, root.offsetHeight);
};

/**
 * Flush the temporary layer to the focused layer.
 */
export const flushTempLayer = (z: PaintState) => {
	// If nothing to flush, just return.
	if (z.tempBd.l === Infinity) return;

	const tool = z.toolType();
	const tempCtx = getTempLayerCtx(z);
	const focusedCtx = getFocusedLayerCtx(z);
	const size = z.size();

	// Extract the boundary
	const bd = limitBoundaryToOriginRect(z.tempBd, size.w, size.h);
	// Bound to the canvas
	const rect = boundaryToRect(bd);
	const oldImg = extractCanvasRect(focusedCtx, rect);

	if (ERASER_TYPE_TOOLS.has(tool)) {
		focusedCtx.clearRect(rect.x, rect.y, rect.w, rect.h);
	}

	focusedCtx.drawImage(
		tempCtx.canvas,
		rect.x,
		rect.y,
		rect.w,
		rect.h,
		rect.x,
		rect.y,
		rect.w,
		rect.h,
	);

	// Create an action, to be able to revert
	const action: UpdateImgAction = {
		type: "updateImg",
		rect,
		oldImg,
	};

	// Apply action
	z.history.push([action]);

	// Clear the temp layer
	clearTempLayer(z, rect);
	z.tempBd = { ...EMPTY_BOUNDARY };
};

// --- Rendering
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

/**
 * Draw a middle of freedraw lines.
 */
const drawFree = (
	z: PaintState,
	lastX: number,
	lastY: number,
	x: number,
	y: number,
) => {
	const ctx = getTempLayerCtx(z);

	const dx = x - lastX;
	const dy = y - lastY;

	if (dx * dx + dy * dy < 1.4) return;
	const fx = Math.floor(x),
		fy = Math.floor(y);
	z.ptrState!.last = {
		x: fx,
		y: fy,
	};

	const brush = getBrush(z);
	const shape = brush.shape;
	const brushRect = boundaryToRect(shape.bd);

	ctx.save();
	contextUseToolStyle(z, ctx);
	let lx = 0,
		ly = 0;
	drawLineWithCallbacks(
		lastX,
		lastY,
		fx,
		fy,
		(x, y, l) => {
			console.log(`x=${x}, y=${y}, w=${l}`);
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
			console.log(`x=${x}, y=${y}, h=${l}`);
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
	ctx.restore();
};

/** Draw if pointer is down */
const drawIfPointerDown = (z: PaintState) => {
	if (!z.ptrState) return;

	const pos = getBrushPos(z);

	drawFree(z, z.ptrState.last.x, z.ptrState.last.y, pos.x, pos.y);
};

/**
 * Action apply helper for history manager
 */
const execAction = (z: PaintState, a: Action): void | Action => {
	switch (a.type) {
		case "updateImg":
			const ctx = getFocusedLayerCtx(z);
			const { rect, newImg } = a;
			if (!newImg) {
				toast.error("Unknown error");
				console.error("exec failed: newImg is not set.");
				return;
			}
			putContextToContext(ctx, newImg, rect.x, rect.y);
			clearTempLayer(z, rect);
			return a;
		default:
			throw new Error(`Unknown action type to execute: ${a.type}`);
	}
};

/**
 * Action revert helper for history manager
 */
const revertAction = (z: PaintState, a: Action) => {
	switch (a.type) {
		case "updateImg":
			const ctx = getFocusedLayerCtx(z);
			const { rect, oldImg } = a;
			if (!oldImg) {
				toast.error("Unknown error");
				console.error("revert failed: oldImg is not set.");
				return;
			}
			if (!a.newImg) {
				a.newImg = extractCanvasRect(ctx, rect);
			}
			putContextToContext(ctx, oldImg, rect.x, rect.y);
			clearTempLayer(z, rect);
			return a;
		default:
			throw new Error(`Unknown action type to revert: ${a.type}`);
	}
};

/** Undo the last action */
export const undo = (z: PaintState) => {
	if (!z.history.undo()) {
		toast.error("Nothing to undo");
	}
};

/** Redo the next action */
export const redo = (z: PaintState) => {
	if (!z.history.redo()) {
		toast.error("Nothing to redo");
	}
};

// --- Event Handlers

export const handlePointerDown = (z: PaintState) => {
	const pos = getBrushPos(z);

	const x = Math.floor(pos.x),
		y = Math.floor(pos.y);

	z.ptrState = {
		start: { ...pos },
		last: { x, y },
	};

	drawSingleBrush(z, x, y);
};

export const handlePointerUp = (z: PaintState, buttonDown: boolean) => {
	if (buttonDown) {
		const pos = getBrushPos(z);
		drawSingleBrush(z, Math.floor(pos.x), Math.floor(pos.y));
	}

	z.ptrState = undefined;
	flushTempLayer(z);
};

// --- Step function

/**
 * Step function which should be called periodically.
 *
 * @param z PaintState
 */
export const stepForPaintState = (z: PaintState) => {
	const now = Date.now();
	const dt = now - z.lastStepMS;
	z.lastStepMS = now;

	updateBrushCursorPos(z, dt);
	drawIfPointerDown(z);
};
