export const emptyCtx = (
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
