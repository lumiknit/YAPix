import { Pos, Rect, ORIGIN } from ".";
import { emptyCanvasContext } from "./utils";

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
	data: ImageData;
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
		data: new ImageData(w, h),
	};
};

/**
 *
 */
export const cloneLayer = (layer: Layer): Layer => {
	return {
		...layer,
		data: new ImageData(
			new Uint8ClampedArray(layer.data.data),
			layer.data.width,
			layer.data.height,
		),
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
	const ctx = emptyCanvasContext(width, height);

	ctx.putImageData(layer.data, dx, dy);
	const newImageData = ctx.getImageData(dx, dy, width, height);
	return {
		...layer,
		off: {
			x: layer.off.x + dx,
			y: layer.off.y + dy,
		},
		data: newImageData,
	};
};

export const drawLayerToCanvas = (
	ctx: CanvasRenderingContext2D,
	layer: Layer,
) => {
	const ectx = emptyCanvasContext(layer.data.width, layer.data.height);
	ectx.putImageData(layer.data, 0, 0);
	ctx.drawImage(ectx.canvas, layer.off.x, layer.off.y);
};

export const canvasToLayer = (
	canvas: HTMLCanvasElement,
	name: string,
): Layer => {
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2d context");
	return {
		name,
		off: { ...ORIGIN },
		opacity: 1,
		data: ctx.getImageData(0, 0, canvas.width, canvas.height),
	};
};
