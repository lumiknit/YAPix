import { RGB } from "solid-tiny-color";

export type PaintConfigCanvasBackground = {
	color1: RGB;
	color2: RGB;
	size: number;
};

export type PaintConfig = {
	/**
	 * fps for rendering / brush processing.
	 */
	fps?: number;

	/**
	 * Action for canvas click & drag.
	 * - "moveTouchOnly": If touch event, work as "move" (Default)
	 * - "draw": Draw (brush / shape / etc.)
	 * - "move": Move cursor by dragging
	 */
	canvasClickAction?: "draw" | "move" | "moveTouchOnly";

	/**
	 * Brush stabilization.
	 * - 0: Disabled (Default)
	 * - 1-20: Stabilization level
	 */
	brushStabilization?: number;

	/**
	 * Max history size.
	 * Default is 100, min is 8.
	 */
	maxHistory?: number;

	/**
	 * Background Checkboard Config
	 */
	bgCheckerboard?: PaintConfigCanvasBackground;
};

export type CompiledPaintConfig = PaintConfig & {
	/** Interval of each frame in ms */
	fpsMS: number;

	/** Canvas click action */
	canvasClickAction: "draw" | "move" | "moveTouchOnly";

	/** Brush stabilization factor. (0, 1] */
	brushStabFactor: number;

	/** Max history size */
	maxHistory: number;

	/** Background Checkboard Config */
	bgCheckerboard: PaintConfigCanvasBackground;
};

export const compilePaintConfig = (
	config: PaintConfig,
): CompiledPaintConfig => {
	return {
		...config,
		fpsMS: 1000 / (config.fps || 60),
		canvasClickAction: config.canvasClickAction || "moveTouchOnly",
		brushStabFactor: Math.pow(0.1, config.brushStabilization || 0),
		maxHistory: Math.max(config.maxHistory || 100, 8),
		bgCheckerboard: config.bgCheckerboard || {
			color1: [102, 102, 102],
			color2: [153, 153, 153],
			size: 32,
		},
	};
};
