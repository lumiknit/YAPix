import {
	AppWrap,
	Boundary,
	EMPTY_BOUNDARY,
	boundaryToRect,
	extractCanvasRect,
	limitBoundaryToOriginRect,
} from "@/common";
import toast from "solid-toast";

import { HistoryManager } from "../action-history";
import { Action, UpdateImgAction } from "../actions";

import { ERASER_TYPE_TOOLS, PaintConfig } from "..";

import { WithBrushSetSignal, installBrushSetSignal } from "./brush";
import {
	clearTempLayer,
	renderBlurredLayerFromState,
	updateBrushCursorPos,
} from "./composited";
import { WithConfigSignal, installConfigSignal } from "./config";
import { WithCursorSignal, installCursorSignal } from "./cursor";
import {
	WithDisplaySignal,
	fitDisplayTo,
	installDisplaySignal,
} from "./display";
import { stepDrawShape, stepSpoid } from "./draw";
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
import { execAction, revertAction } from "./action";

export type PaintState = WithBrushSetSignal &
	WithConfigSignal &
	WithCursorSignal &
	WithDisplaySignal &
	WithImageInfo &
	WithPaletteSignal &
	WithToolSettingsSignal &
	WithUIInfo & {
		/** History manager */
		history: HistoryManager<Action>;

		/** temporary draw boundary. Only this area will be flushed to focused layer */
		tempBd: Boundary;

		/** Timestamp when the step function was called, in ms. */
		lastStepMS: number;

		/**
		 * Callback for draw function, which is called in step function.
		 */
		stepDraw?: (z: PaintState, force?: boolean) => void;
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
	renderBlurredLayerFromState(z);

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

export const executeAction = (z: PaintState, actions: Action[]) => {
	z.history.exec(actions);
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

	switch (z.toolType()) {
		case "brush":
		case "eraser":
			z.stepDraw = stepDrawShape;
			break;
		case "spoid":
			z.stepDraw = stepSpoid;
			break;
	}

	z.stepDraw!(z, true);
};

/**
 * Handle draw end event.
 */
export const handleDrawEnd = (z: PaintState, cancelled?: boolean) => {
	if (!cancelled) {
		z.stepDraw?.(z, true);
	}

	z.stepDraw = undefined;
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
	z.stepDraw?.(z);
};
