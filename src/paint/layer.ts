import { Pos, ORIGIN, CanvasCtx2D } from "@/common";

import { emptyCanvasContext, putContextToContext } from "@/common";

/** Layer information without pixel/vector data */
export type LayerInfo = {
	/** Name of the layer */
	name: string;

	/** Layer x/y offset */
	off: Pos;

	/** Opacity */
	opacity: number;
};

/** Layer Information with pixel data */
export type Layer = LayerInfo & {
	/** Image data */
	data: CanvasCtx2D;
};

/**
 * Detach layer information from the layer.
 *
 * @param withLayerInfo An object extends LayerInfo
 */
export const detachLayerInfo = (withLayerInfo: LayerInfo): LayerInfo =>
	Object.fromEntries(
		(["name", "off", "opacity"] as (keyof LayerInfo)[]).map(key => [
			key,
			withLayerInfo[key],
		]),
	) as LayerInfo;

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
 * Clone a layer.
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

export const drawLayerToCanvas = (ctx: CanvasCtx2D, layer: Layer) => {
	ctx.drawImage(layer.data.canvas, layer.off.x, layer.off.y);
};
