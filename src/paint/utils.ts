import { Rect } from "./types";

/** Create empty canvas 2d context */
export const emptyCanvasContext = (
	width: number,
	height: number,
): CanvasRenderingContext2D => {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2d context");
	return ctx;
};

/** Extract rect and create new canvas context */
export const extractCanvasRect = (
	ctx: CanvasRenderingContext2D,
	rect: Rect,
): CanvasRenderingContext2D => {
	const newCtx = emptyCanvasContext(rect.w, rect.h);
	newCtx.drawImage(
		ctx.canvas,
		rect.x,
		rect.y,
		rect.w,
		rect.h,
		0,
		0,
		rect.w,
		rect.h,
	);
	return newCtx;
};

/** Put context image to the target context, ignoring alpha blending */
export const putContextToContext = (
	ctx: CanvasRenderingContext2D,
	src: CanvasRenderingContext2D,
	dx: number,
	dy: number,
): void => {
	ctx.save();
	ctx.globalCompositeOperation = "source-over";
	ctx.clearRect(dx, dy, src.canvas.width, src.canvas.height);
	ctx.drawImage(src.canvas, dx, dy);
	ctx.restore();
};
