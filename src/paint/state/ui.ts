import { Accessor, Setter, createSignal } from "solid-js";

export type WithUIInfo = {
	// State
	showFocusedLayer: Accessor<boolean>;
	setShowFocusedLayer: Setter<boolean>;

	// Refs
	/** Root ref */
	rootRef?: HTMLDivElement;

	/** Main layer canvas ref */
	focusedLayerRef?: HTMLCanvasElement;

	/** Above layer canvas ref */
	aboveLayerRef?: HTMLCanvasElement;

	/** Below layer canvas ref */
	belowLayerRef?: HTMLCanvasElement;

	/** Temp (painting) layer canvas ref */
	tempLayerRef?: HTMLCanvasElement;
};

export const installUIInfo = <T extends object>(target: T): T & WithUIInfo => {
	const [showFocusedLayer, setShowFocusedLayer] = createSignal(true);
	return Object.assign(target, {
		showFocusedLayer,
		setShowFocusedLayer,
	});
};

/**
 * Get temp canvas context
 */
export const getTempLayerCtx = (ui: WithUIInfo): CanvasRenderingContext2D => {
	if (!ui.tempLayerRef) throw new Error("Temp layer ref is not set");
	const ctx = ui.tempLayerRef.getContext("2d");
	if (!ctx) throw new Error("Failed to get temp layer context");
	return ctx;
};

/**
 * Get focused canvas context
 */
export const getFocusedLayerCtx = (
	ui: WithUIInfo,
): CanvasRenderingContext2D => {
	if (!ui.focusedLayerRef) throw new Error("Focused layer ref is not set");
	const ctx = ui.focusedLayerRef.getContext("2d");
	if (!ctx) throw new Error("Failed to get focused layer context");
	return ctx;
};
