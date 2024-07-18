import { Rect, Size } from ".";

/**
 * Common interfaces for (offscreen) canvas context 2D.
 */
export type CanvasCtx2D =
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D;

/**
 * Create empty canvas 2d context.
 * This uses OffscreenCanvas if available.
 *
 * @param width Canvas width
 * @param height Canvas height
 * @returns CanvasContext2D. It may be offscreen one.
 */
export const emptyCanvasContext = (
	width: number,
	height: number,
): CanvasCtx2D => {
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2d context");
	return ctx;
};

/**
 * Get the size of the context.
 *
 * @param ctx Canvas context
 * @returns Size of the context
 */
export const getContextSize = (ctx: CanvasCtx2D): Size => ({
	width: ctx.canvas.width,
	height: ctx.canvas.height,
});

/**
 * Extract the specified rectangle area from canvas, and return it as new canvas.
 */
export const extractCanvasRect = (
	ctx: CanvasCtx2D,
	rect: Rect,
): CanvasCtx2D => {
	const newCtx = emptyCanvasContext(rect.width, rect.height);
	newCtx.drawImage(
		ctx.canvas,
		rect.x,
		rect.y,
		rect.width,
		rect.height,
		0,
		0,
		rect.width,
		rect.height,
	);
	return newCtx;
};

/** Put context image to the target context, ignoring alpha blending */
export const putContextToContext = (
	ctx: CanvasCtx2D,
	src: CanvasCtx2D,
	dx: number,
	dy: number,
): void => {
	ctx.save();
	ctx.globalCompositeOperation = "source-over";
	ctx.clearRect(dx, dy, src.canvas.width, src.canvas.height);
	ctx.drawImage(src.canvas, dx, dy);
	ctx.restore();
};

/**
 * Convert canvas to blob.
 */
export const ctxToBlob = (
	ctx: CanvasCtx2D,
	type?: string | undefined,
	quality?: any,
): Promise<Blob> => {
	const canvas = ctx.canvas;
	if (canvas instanceof HTMLCanvasElement) {
		return new Promise(resolve => {
			canvas.toBlob(
				blob => {
					if (!blob) throw new Error("Failed to convert canvas to blob");
					resolve(blob);
				},
				type,
				quality,
			);
		});
	} else {
		return canvas.convertToBlob({
			type,
			quality,
		});
	}
};

/**
 * Convert the context into PNG Base64
 */
export const ctxToPNGBase64 = async (ctx: CanvasCtx2D): Promise<string> => {
	const blob = await ctxToBlob(ctx, "image/png");
	const u8arr = new Uint8Array(await blob.arrayBuffer());
	return btoa(String.fromCharCode(...u8arr));
};

/**
 * Create the context from PNG Base64
 */
export const ctxFromPNGBase64 = async (
	base64: string,
): Promise<CanvasCtx2D> => {
	const img = new Image();
	img.src = `data:image/png;base64,${base64}`;
	await img.decode();
	const ctx = emptyCanvasContext(img.width, img.height);
	ctx.drawImage(img, 0, 0);
	return ctx;
};
