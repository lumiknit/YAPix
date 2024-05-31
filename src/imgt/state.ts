import { NumVec4, RGBA } from "./color";
import { Layer, putLayerToCanvas } from "./layer";

export class State {
	/** Image width */
	width: number;

	/** Image height */
	height: number;

	/** Layers. 0 is bottom. */
	layers: Layer[];

	/** Selected layer */
	selectedLayer: number;

	// Layers

	/** Main layer canvas ref */
	mainLayerRef?: HTMLCanvasElement;

	/** Above layer canvas ref */
	aboveLayerRef?: HTMLCanvasElement;

	/** Below layer canvas ref */
	belowLayerRef?: HTMLCanvasElement;

	/** Main colors */
	color1: RGBA;
	/** Sub colors */
	color2: RGBA;
	/** Color history */
	colorHistory: RGBA[];

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.layers = [];
		this.selectedLayer = 0;
		this.color1 = [255, 0, 0, 255];
		this.color2 = [255, 255, 255, 255];
		this.colorHistory = [];
	}

	render(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Failed to get 2d context");

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (const layer of this.layers) {
			putLayerToCanvas(ctx, layer);
		}
	}

	swapColors() {
		const tmp = this.color1;
		this.color1 = this.color2;
		this.color2 = tmp;
	}

	addColorToHistory() {
		this.colorHistory.push(this.color1);
	}
}
