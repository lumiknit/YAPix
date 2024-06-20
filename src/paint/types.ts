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
	| "spoid"
	| "text";

/** Tools whose brush work as eraser, not paint. */
export const ERASER_TYPE_TOOLS: Set<ToolType> = new Set(["eraser", "deselect"]);

/** This types will change the layer pixels. Thus flush is required. */
export const IMAEG_MODIFY_TOOLS: Set<ToolType> = new Set([
	"brush",
	"eraser",
	"text",
	"move",
	"zoom",
]);

/** This types need to show brush-shape cursor */
export const BRUSH_SHAPE_CURSOR_TOOLS: Set<ToolType> = new Set([
	"brush",
	"eraser",
]);

/** Draw shape */
export type DrawShape =
	| "free"
	| "rect"
	| "fillRect"
	| "fillEllipse"
	| "line"
	| "fill";
