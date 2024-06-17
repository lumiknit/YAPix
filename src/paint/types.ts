import { Pos } from "@/common";

/** Cursor */
export type Cursor = {
	/**
	 * Real cursor position
	 */
	real: Pos;

	/**
	 * Brush position.
	 * If brush stabilization is enabled, this value is different from the real cursor position.
	 */
	brush: Pos;
};

/** Tool Type */
export type ToolType =
	| "brush"
	| "eraser"
	| "select"
	| "deselect"
	| "move"
	| "zoom"
	| "spoid";

export const ERASER_TYPE_TOOLS: Set<ToolType> = new Set(["eraser", "deselect"]);

/** Draw shape */
export type DrawShape =
	| "free"
	| "rect"
	| "fillRect"
	| "fillEllipse"
	| "line"
	| "fill";
