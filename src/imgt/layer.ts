import { emptyCtx } from "./utils";

export type Layer = {
	/** Name of the layer */
	name: string;

	/** Layer x position */
	x: number;
	/** Layer y position */
	y: number;

	/** Image data */
	data: ImageData;
};

export const createEmptyLayer = (
	name: string,
	width: number,
	height: number,
): Layer => {
	return {
		name,
		x: 0,
		y: 0,
		data: new ImageData(width, height),
	};
};

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
	const ctx = emptyCtx(width, height);

	ctx.putImageData(layer.data, dx, dy);
	const newImageData = ctx.getImageData(dx, dy, width, height);
	return {
		name: layer.name,
		x: layer.x + dx,
		y: layer.y + dy,
		data: newImageData,
	};
};

export const putLayerToCanvas = (
	ctx: CanvasRenderingContext2D,
	layer: Layer,
) => {
	ctx.putImageData(layer.data, layer.x, layer.y);
};

export const canvasToLayer = (
	canvas: HTMLCanvasElement,
	name: string,
): Layer => {
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2d context");
	return {
		name,
		x: 0,
		y: 0,
		data: ctx.getImageData(0, 0, canvas.width, canvas.height),
	};
};
