import { Accessor, Setter, createSignal } from "solid-js";
import { rgbToStyle } from "solid-tiny-color";

import {
	CanvasCtx2D,
	RGBA,
	Size,
	emptyCanvasContext,
	rgba,
	rgbaForStyle,
} from "@/common";

import { Layer, PaintConfigCanvasBackground, drawLayerToCanvas } from "..";

export type WithImageInfo = {
	/** Getter for Size */
	size: Accessor<Size>;

	/** Setter for Size */
	setSize: Setter<Size>;

	/** Layers */
	layers: Layer[];

	/** Background color */
	bgColor: RGBA;

	/** Current focused layer */
	focusedLayer: number;
};

export const installImageInfo =
	<T extends object>(w: number, h: number) =>
	(target: T): T & WithImageInfo => {
		const [size, setSize] = createSignal({ w, h });
		return Object.assign(target, {
			size,
			setSize,
			layers: [],
			bgColor: rgba(0, 0, 0, 0),
			focusedLayer: -1,
		});
	};

export const mergeLayersWithNewCtx = (
	z: WithImageInfo,
	scale: number,
): CanvasCtx2D => {
	const size = z.size();

	// Merge layers
	const ectx = emptyCanvasContext(size.w, size.h);
	for (let i = 0; i < z.layers.length; i++) {
		drawLayerToCanvas(ectx, z.layers[i]);
	}
	scale = Math.min(1, Math.floor(scale));
	if (scale <= 1) return ectx;

	// Scale-up the merged image
	const ctx = emptyCanvasContext(size.w * scale, size.h * scale);
	ctx.scale(scale, scale);
	ctx.imageSmoothingEnabled = false;
	ctx.imageSmoothingQuality = "low";
	ctx.drawImage(ectx.canvas, 0, 0);

	return ctx;
};

/**
 * Render non-focused layers to each canvas context.
 * The background color will be render under the below layers.
 *
 * @param z State
 * @param bgConfig Background (checkerboard) configuration
 * @param below Below layer canvas context
 * @param above Above layer canvas context
 */
export const renderBlurredLayer = (
	z: WithImageInfo,
	bgConfig: PaintConfigCanvasBackground,
	below: CanvasCtx2D,
	above: CanvasCtx2D,
) => {
	const size = z.size();

	// Render below layers
	below.globalCompositeOperation = "source-over";

	// If background color is transparent, fill the canvas with checkerboard
	if (z.bgColor[3] < 255) {
		below.fillStyle = rgbToStyle(bgConfig.color1);
		below.fillRect(0, 0, size.w, size.h);
		below.fillStyle = rgbToStyle(bgConfig.color2);
		for (let y = 0; y < size.h; y += bgConfig.size) {
			for (
				let x = ((y / bgConfig.size) % 2) * bgConfig.size;
				x < size.w;
				x += 2 * bgConfig.size
			) {
				below.fillRect(x, y, bgConfig.size, bgConfig.size);
			}
		}
	}

	// Draw background color
	below.fillStyle = rgbaForStyle(z.bgColor);
	below.fillRect(0, 0, size.w, size.h);

	// Then, draw layers below the focused layer
	for (let i = 0; i < z.focusedLayer; i++) {
		drawLayerToCanvas(below, z.layers[i]);
	}

	// Render for the top layer
	above.clearRect(0, 0, size.w, size.h);
	above.globalCompositeOperation = "source-over";
	for (let i = z.focusedLayer + 1; i < z.layers.length; i++) {
		drawLayerToCanvas(above, z.layers[i]);
	}
};

/**
 * Update the focused layer with the given canvas context.
 *
 * @param z State
 * @param ctx Canvas context which have data
 */
export const updateFocusedLayerDataWith = (
	z: WithImageInfo,
	ctx: CanvasCtx2D,
) => {
	const size = z.size();
	const target = z.layers[z.focusedLayer].data;
	target.clearRect(0, 0, size.w, size.h);
	target.drawImage(ctx.canvas, 0, 0);
};
