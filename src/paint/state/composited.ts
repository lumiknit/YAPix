/**
 * @module composited
 * @description PaintState methods, which does not need full of PaintState.
 *
 * This module contains methods, which use a part of PaintState, but not all of them.
 */

import { batch } from "solid-js";

import {
	CanvasCtx2D,
	ORIGIN,
	Pos,
	Rect,
	centerOfBoundary,
	centerOfRect,
	rgba,
	rgbaForStyle,
	rotateScale2D,
	rotateScaleRaw2D,
} from "@/common";
import { ERASER_TYPE_TOOLS, Layer, ToolType, putOptimizedLayer } from "..";

import {
	Brush,
	WithBrushSetSignal,
	WithCursorSignal,
	WithDisplaySignal,
	WithImageInfo,
	WithPaletteSignal,
	WithToolSettingsSignal,
	WithUIInfo,
	applyDisplayTransform,
	getFocusedLayerCtx,
	getTempLayerCtx,
	insertNewLayer,
	invertDisplayTransform,
	renderBlurredLayer,
	setBrushShape,
} from ".";

export const renderBlurredLayerFromState = (z: WithUIInfo & WithImageInfo) =>
	renderBlurredLayer(
		z,
		z.belowLayerRef?.getContext("2d")!,
		z.aboveLayerRef?.getContext("2d")!,
	);

/**
 * Get the brush cursor position, the (x, y) of brush shape's top-left corner.
 */
export const getBrushCursorPos = (
	z: WithBrushSetSignal & WithToolSettingsSignal & WithCursorSignal,
): Pos => {
	const cur = z.cursor();
	const hbs = getBrush(z).size / 2;
	return {
		x: Math.round(cur.brush.x - hbs),
		y: Math.round(cur.brush.y - hbs),
	};
};

/**
 * Check the brush is out of screen.
 * It is useful to detect cursor is out of screen, and move cursor into the screen.
 */
export const isBrushOutOfScreen = (
	z: WithCursorSignal & WithUIInfo & WithDisplaySignal,
): boolean => {
	if (!z.rootRef) return false;
	const b = z.cursor().brush;
	const ip = applyDisplayTransform(z, b);
	const rect = z.rootRef.getBoundingClientRect();
	return ip.x < 0 || ip.y < 0 || ip.x > rect.width || ip.y > rect.height;
};

/**
 * Move the cursor to the center of root ref.
 */
export const moveCursorToCenter = (
	z: WithCursorSignal & WithDisplaySignal & WithUIInfo,
) => {
	if (!z.rootRef) return false;
	const rect = z.rootRef.getBoundingClientRect();
	const ip = invertDisplayTransform(z, centerOfRect(rect));
	z.setCursor({
		real: ip,
		brush: ip,
	});
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
	const center = centerOfBoundary(b.shape.bd);
	return {
		x: cb.x + 0.5 - center.x,
		y: cb.y + 0.5 - center.y,
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
		...ORIGIN,
		...size,
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
		case "text":
			ctx.strokeStyle = ctx.fillStyle = rgbaForStyle(z.palette().current);
			ctx.globalCompositeOperation = "source-over";
			break;
		// Use fixed color, with source-over
		case "select":
			ctx.strokeStyle = ctx.fillStyle = rgbaForStyle(rgba(255, 0, 0, 255));
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

/**
 * Rotate and scale the display by the given center.
 * If center is not provided, it will be the center of the canvas.
 */
export const rotateScaleDisplayByCenter = (
	z: WithImageInfo & WithDisplaySignal,
	rotate: number,
	scale: number,
	center?: Pos,
) => {
	const sz = z.size();
	if (!center) {
		center = {
			x: sz.width / 2,
			y: sz.height / 2,
		};
	}

	const oldZoom = z.zoom(),
		oldAngle = z.angle(),
		newZoom = oldZoom * scale,
		rad = oldAngle.rad + rotate,
		cos = Math.cos(rad),
		sin = Math.sin(rad);

	const oldCenter = rotateScale2D(oldAngle.rad, oldZoom, center);
	const newCenter = rotateScaleRaw2D(cos, sin, newZoom, center);

	// Set the values
	batch(() => {
		z.setZoom(newZoom);
		z.setAngle({ rad, cos, sin });
		z.setScroll(s => ({
			x: s.x + oldCenter.x - newCenter.x,
			y: s.y + oldCenter.y - newCenter.y,
		}));
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
	ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

	if (ERASER_TYPE_TOOLS.has(tool)) {
		// In z case, copy the contents from the focused layer
		const focusedCtx = getFocusedLayerCtx(z);
		const oldComposite = ctx.globalCompositeOperation;
		ctx.globalCompositeOperation = "source-over";
		ctx.drawImage(
			focusedCtx.canvas,
			rect.x,
			rect.y,
			rect.width,
			rect.height,
			rect.x,
			rect.y,
			rect.width,
			rect.height,
		);
		ctx.globalCompositeOperation = oldComposite;
	}
};

// --- Layers

/**
 * Update the focused layer data from the focused layer context.
 */

export const updateFocusedLayerData = (z: WithImageInfo & WithUIInfo) => {
	const layers = z.layers();
	const focused = z.focusedLayer();
	const focusedCtx = getFocusedLayerCtx(z);
	putOptimizedLayer(layers[focused], focusedCtx);
};

/**
 * Refresh all layer contexts.
 * This will update focused context, clear temp context, and then render blurred layers
 * based on the data in layers.
 */
export const rerenderLayers = (
	z: WithToolSettingsSignal & WithImageInfo & WithUIInfo,
) => {
	const ls = z.layers();
	const focusedIndex = z.focusedLayer();
	const focusedCtx = getFocusedLayerCtx(z);
	// Draw the data of the new focused layer to the focused ctx
	const newFocused = ls[focusedIndex];
	focusedCtx.save();
	focusedCtx.globalCompositeOperation = "copy";
	focusedCtx.drawImage(
		newFocused.data.canvas,
		newFocused.off.x,
		newFocused.off.y,
	);
	focusedCtx.restore();

	// Clear the temp layer
	clearTempLayer(z, {
		...ORIGIN,
		...z.size(),
	});

	// Update non-focused
	renderBlurredLayerFromState(z);
};

/**
 * Change focused layer.
 * This will flush the current drawing to focused layer,
 * and update the focused layer index.
 */
export const changeFocusedLayer = (
	z: WithToolSettingsSignal & WithImageInfo & WithUIInfo,
	newIndex: number,
	noUpdateLayer?: boolean,
) => {
	if (newIndex < 0 || newIndex >= z.layers().length) return;
	batch(() => {
		// Flush the focused ctx to layer's info
		if (!noUpdateLayer) updateFocusedLayerData(z);

		// Change the focused layer
		z.setFocusedLayer(newIndex);

		rerenderLayers(z);
	});
};

/**
 * Delete the layer at index.
 *
 * @returns [0] The deleted layer, [1] if the deleted layer was focused, [2] if the empty layer was created.
 */
export const deleteLayer = (
	z: WithToolSettingsSignal & WithImageInfo & WithUIInfo,
	index: number,
): [Layer, boolean, boolean] => {
	let deleted;
	let focusChanged = false;
	let empty = false;

	const fl = z.focusedLayer();
	let newFocus = fl;

	if (fl === index) {
		// Change focused layer to the other one.
		if (fl + 1 < z.layers().length) {
			// Next layer
			newFocus++;
		} else {
			if (fl === 0) {
				// No layer to focus. Insert a new layer.
				insertNewLayer(z, "Layer 0", 0);
				empty = true;
				index++;
				newFocus++;
				z.setFocusedLayer(index);
			}
			newFocus--;
		}
		changeFocusedLayer(z, newFocus);
		focusChanged = true;
		console.log("Focus changed", newFocus, index);
	}

	// Now, delete the layer

	z.setLayers(ls => {
		[deleted] = ls.splice(index, 1);
		return ls;
	});

	if (newFocus > fl) {
		// In this case the focused layer is moved to the left.
		// Just update the focused layer index.
		z.setFocusedLayer(newFocus - 1);
	}

	renderBlurredLayerFromState(z);

	return [deleted!, focusChanged, empty];
};
