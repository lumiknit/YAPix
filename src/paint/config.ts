export type PaintConfig = {
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
};
