import {
	AppWrap,
	Boundary,
	EMPTY_BOUNDARY,
	boundaryToRect,
	extractCanvasRect,
	limitBoundaryToOriginRect,
	putContextToContext,
} from "@/common";
import toast from "solid-toast";

import { HistoryManager } from "../action-history";
import { Action, UpdateImgAction } from "../actions";

import { ERASER_TYPE_TOOLS, PaintConfig } from "..";

import { WithBrushSetSignal, installBrushSetSignal } from "./brush";
import { clearTempLayer, updateBrushCursorPos } from "./composited";
import { WithConfigSignal, installConfigSignal } from "./config";
import { WithCursorSignal, installCursorSignal } from "./cursor";
import {
	WithDisplaySignal,
	fitDisplayTo,
	installDisplaySignal,
} from "./display";
import { drawIfPointerDown } from "./draw";
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

// --- History

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

/**
 * Handle draw start event.
 */
export const handleDrawStart = (z: PaintState) => {
	const pos = z.cursor().brush;
	console.log(pos);
	z.ptrState = {
		start: { ...pos },
		last: { ...pos },
	};

	drawIfPointerDown(z, true);
};

/**
 * Handle draw end event.
 */
export const handleDrawEnd = (z: PaintState, cancelled?: boolean) => {
	if (!cancelled) {
		drawIfPointerDown(z, true);
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
