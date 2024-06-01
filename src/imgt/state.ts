import { Accessor, createSignal, Setter } from "solid-js";
import { rgba, RGBA } from "./color";
import { Layer, putLayerToCanvas } from "./layer";
import { Display, ORIGIN, Pos } from "./types";

export type Palette = {
	/** Current color */
	current: RGBA;

	/** Previous colors */
	history: RGBA[];
};

export class State {
	// Meta Data

	/** Image width */
	width: number;

	/** Image height */
	height: number;

	/** Layers. 0 is bottom. */
	layers: Layer[];

	// Editing state

	/** Display state */
	display: Accessor<Display>;

	/** Display state setter */
	setDisplay: Setter<Display>;

	/** Cursor */
	cursor: Accessor<Pos>;

	/** Cursor setter */
	setCursor: Setter<Pos>;

	/** Selected layer */
	focusedLayer: number;

	/** Current activated color */
	palette: Accessor<Palette>;

	/** Color setter */
	setPalette: Setter<Palette>;

	// Canvas Refs

	/** Main layer canvas ref */
	focusedLayerRef?: HTMLCanvasElement;

	/** Above layer canvas ref */
	aboveLayerRef?: HTMLCanvasElement;

	/** Below layer canvas ref */
	belowLayerRef?: HTMLCanvasElement;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.layers = [];

		this.focusedLayer = 0;

		[this.palette, this.setPalette] = createSignal({
			current: rgba(255, 255, 0, 255),
			history: [] as RGBA[],
		});

		[this.display, this.setDisplay] = createSignal({
			x: 0,
			y: 0,
			zoom: 8,
		});

		[this.cursor, this.setCursor] = createSignal({ ...ORIGIN });
	}

	render(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Failed to get 2d context");

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (const layer of this.layers) {
			putLayerToCanvas(ctx, layer);
		}
	}

	/**
	 * Extract image data from the focused layer, and set it to the focused layer canvas.
	 * Since focused layer's image data may be different from the one in layers,
	 * you must back up the focused layer's image data before use some other operations.
	 */
	updateFocusedLayer() {
		if (!this.focusedLayerRef) return;
		const ctx = this.focusedLayerRef.getContext("2d");
		if (!ctx) throw new Error("Failed to get 2d context");

		const layer = this.layers[this.focusedLayer];
		if (!layer) return;

		const data = ctx.getImageData(0, 0, this.width, this.height);
		layer.data = data;
	}

	/**
	 * Change the current color
	 * @param color The color to set.
	 */
	useColor(color: RGBA) {
		this.setPalette(p => ({
			current: color,
			history: [...p.history, p.current],
		}));
	}

	/** invertTransform */
	invertTransform(x: number, y: number): [number, number] {
		const d = this.display();
		return [(x - d.x) / d.zoom, (y - d.y) / d.zoom];
	}
}
