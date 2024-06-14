/**
 * @module composition
 * @description PaintState methods, which does not need full of PaintState.
 */
import { batch, enableExternalSource } from "solid-js";

import {
	CanvasCtx2D,
	Pos,
	Rect,
	rgba,
	rgbaForStyle,
	scaleRotate2D,
} from "@/common";
import { ERASER_TYPE_TOOLS, ToolType } from "..";

import {
	Brush,
	WithBrushSetSignal,
	WithConfigSignal,
	WithCursorSignal,
	WithDisplaySignal,
	WithImageInfo,
	WithPaletteSignal,
	WithToolSettingsSignal,
	WithUIInfo,
	getFocusedLayerCtx,
	getTempLayerCtx,
	setBrushShape,
} from ".";

/** Update brush cursor position
 * @param dt The time difference in milliseconds.
 */
export const updateBrushCursorPos = (
	z: WithConfigSignal & WithCursorSignal & WithBrushSetSignal,
	dt: number,
) => {
	if (!z.ptrState) {
		// Teleport
		z.setCursor(c => ({ ...c, brush: c.real }));
	} else {
		const cfg = z.config();
		const r = Math.pow(cfg.brushStabFactor, dt / 1000);
		z.setCursor(c => {
			return {
				...c,
				brush: {
					x: c.brush.x * (1 - r) + c.real.x * r,
					y: c.brush.y * (1 - r) + c.real.y * r,
				},
			};
		});
	}
};

/**
 * Get the brush cursor position, the (x, y) of brush shape's top-left corner.
 */
export const getBrushCursorPos = (
	z: WithBrushSetSignal & WithToolSettingsSignal & WithCursorSignal,
): Pos => {
	const cur = z.cursor();
	const b = getBrush(z);
	return {
		x: Math.round(cur.brush.x - b.size.w / 2),
		y: Math.round(cur.brush.y - b.size.h / 2),
	};
};

/**
 * Get the brush position, the center pixel of with current cursor.
 * If you floor each axis, it'll be the top-left corner of the center pixel.
 */
export const getBrushPos = (
	z: WithBrushSetSignal & WithToolSettingsSignal & WithCursorSignal,
): Pos => {
	const b = getBrush(z);
	const cb = z.cursor().brush;
	return {
		x: cb.x - (b.shape.bd.r + b.shape.bd.l - 1) / 2,
		y: cb.y - (b.shape.bd.b + b.shape.bd.t - 1) / 2,
	};
};

/**
 * Get the brush for the current tool.
 */
export const getBrush = (
	z: WithBrushSetSignal & WithToolSettingsSignal,
): Brush => {
	const tool = z.toolType();
	let brush = z.brushSet().get(tool);
	if (!brush) {
		brush = setBrushShape(z, tool, 1, true);
	}
	return brush;
};

/**
 * Change the current tool.
 * This will change the current tool type,
 * and update temp & focused layer to work the tool correctly.
 */
export const changeCurrentTool = (
	z: WithImageInfo & WithToolSettingsSignal & WithUIInfo,
	tool: ToolType,
) => {
	batch(() => {
		z.setToolType(tool);
		const eraserType = ERASER_TYPE_TOOLS.has(tool);
		z.setShowFocusedLayer(!eraserType);
	});

	const size = z.size();

	// Clear the temp layer
	clearTempLayer(z, {
		x: 0,
		y: 0,
		w: size.w,
		h: size.h,
	});
};

/**
 * Set the brush shape (size and roundness) for the current tool.
 * @param size The size of the brush, in pixels.
 * @param round Whether the brush is round.
 */
export const setBrushShapeForCurrentTool = (
	z: WithBrushSetSignal & WithToolSettingsSignal,
	size: number,
	round: boolean,
) => {
	const tool = z.toolType();
	return setBrushShape(z, tool, size, round);
};

/**
 * Update the context's style based on the current tool.
 */
export const contextUseToolStyle = (
	z: WithToolSettingsSignal & WithPaletteSignal,
	ctx: CanvasCtx2D,
) => {
	switch (z.toolType()) {
		// Use current color, with source-over
		case "brush":
			ctx.strokeStyle = ctx.fillStyle = rgbaForStyle(z.palette().current);
			ctx.globalCompositeOperation = "source-over";
			break;
		// Use fixed color, with source-over
		case "select":
			ctx.strokeStyle = ctx.fillStyle = rgbaForStyle(rgba(255, 0, 0, 128));
			ctx.globalCompositeOperation = "source-over";
			break;
		// Use fixed color, by erasing
		case "eraser":
		case "deselect":
			ctx.strokeStyle = ctx.fillStyle = rgbaForStyle(rgba(255, 0, 0, 255));
			ctx.globalCompositeOperation = "destination-out";
			break;
		// Otherwise, do not need to update settings.
	}
};

// --- Display

export const rotateScaleDisplayByCenter = (
	z: WithImageInfo & WithDisplaySignal,
	rotate: number,
	scale: number,
) => {
	const sz = z.size();
	const center = {
		x: sz.w / 2,
		y: sz.h / 2,
	};

	const oldZoom = z.zoom(),
		oldAngle = z.angle(),
		newZoom = oldZoom * scale,
		newAngle = oldAngle + rotate;

	const oldCenter = scaleRotate2D(oldAngle, oldZoom, center);
	const newCenter = scaleRotate2D(newAngle, newZoom, center);

	// Set the values
	batch(() => {
		z.setZoom(newZoom);
		z.setAngle(newAngle);
		z.setScroll(s => {
			return {
				x: s.x + oldCenter.x - newCenter.x,
				y: s.y + oldCenter.y - newCenter.y,
			};
		});
	});
};

// --- Rendering

/**
 * Clear the temp layer boundary.
 * The clear method will different by which tool is selected.
 *
 * @param rect The rectangle to clear.
 */
export const clearTempLayer = (
	z: WithToolSettingsSignal & WithUIInfo,
	rect: Rect,
) => {
	const tool = z.toolType();
	const ctx = getTempLayerCtx(z);
	ctx.clearRect(rect.x, rect.y, rect.w, rect.h);

	if (ERASER_TYPE_TOOLS.has(tool)) {
		// In z case, copy the contents from the focused layer
		const focusedCtx = getFocusedLayerCtx(z);
		const oldComposite = ctx.globalCompositeOperation;
		ctx.globalCompositeOperation = "source-over";
		ctx.drawImage(
			focusedCtx.canvas,
			rect.x,
			rect.y,
			rect.w,
			rect.h,
			rect.x,
			rect.y,
			rect.w,
			rect.h,
		);
		ctx.globalCompositeOperation = oldComposite;
	}
};
