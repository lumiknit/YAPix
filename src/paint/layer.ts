import { Pos, ORIGIN } from "@/common";

import { emptyCanvasContext, putContextToContext } from "./utils";

/** Layer data except image data */
export type LayerData = {
	/** Name of the layer */
	name: string;

	/** Layer x/y offset */
	off: Pos;

	/** Opacity */
	opacity: number;
};

export type Layer = LayerData & {
	/** Image data */
	data: CanvasRenderingContext2D;
};

export const extractLayerData = (layer: Layer): LayerData => {
	const l: LayerData = { ...layer };
	delete (l as any).data;
	return l;
};

/**
 * Create an empty layer.
 */
export const createEmptyLayer = (name: string, w: number, h: number): Layer => {
	return {
		name,
		off: { ...ORIGIN },
		opacity: 1,
		data: emptyCanvasContext(w, h),
	};
};

/**
 *
 */
export const cloneLayer = (layer: Layer): Layer => {
	const data = emptyCanvasContext(
		layer.data.canvas.width,
		layer.data.canvas.height,
	);
	data.drawImage(layer.data.canvas, 0, 0);
	return {
		...layer,
		data,
	};
};

/**
 * Resize a layer.
 * If some pixels are cropped, the cropped pixels are lost.
 * If the layer is enlarged, the new pixels are transparent.
 */
export const resizeLayer = (
	layer: Layer,
	width: number,
	height: number,
	dx: number,
	dy: number,
): Layer => {
	const data = emptyCanvasContext(width, height);
	putContextToContext(data, layer.data, dx, dy);
	return {
		...layer,
		off: {
			x: layer.off.x + dx,
			y: layer.off.y + dy,
		},
		data,
	};
};

export const drawLayerToCanvas = (
	ctx: CanvasRenderingContext2D,
	layer: Layer,
) => {
	ctx.drawImage(layer.data.canvas, layer.off.x, layer.off.y);
};

export const canvasToLayer = (
	canvas: HTMLCanvasElement,
	name: string,
): Layer => {
	const data = canvas.getContext("2d");
	if (!data) throw new Error("Failed to get 2d context");
	return {
		name,
		off: { ...ORIGIN },
		opacity: 1,
		data,
	};
};
