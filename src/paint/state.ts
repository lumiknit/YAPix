import { Accessor, createSignal, Setter } from "solid-js";
import { HSV, hsvToRGB, rgbToHSV } from "solid-tiny-color";

import { rgba, RGBA, rgbaForStyle } from "../common/color";
import { Layer, putLayerToCanvas } from "./layer";
import { Cursor, Display, ORIGIN, Pos, Size } from "./types";
import {
	drawLineWithCallbacks,
	ellipsePolygon,
	Polygon,
	polygonTo4SegPath2D,
	polygonToPath2D,
	rectanglePolygon,
} from "./polygon";
import { PaintConfig } from "./config";

export type Brush = {
	/** Brush shape */
	shape: Polygon;

	/** Size */
	size: Size;
};

export type Palette = {
	/** Current color */
	current: RGBA;

	/** HSV */
	hsv: HSV;

	/** Previous colors */
	history: RGBA[];
};

export class State {
	// -- Config
	config: Accessor<PaintConfig>;
	setConfig: Setter<PaintConfig>;

	// -- Meta Data

	/** Image size */
	size: Size;

	/** Layers. 0 is bottom. */
	layers: Layer[];

	// -- Editing state

	/** Display state */
	display: Accessor<Display>;

	/** Display state setter */
	setDisplay: Setter<Display>;

	/** Cursor */
	cursor: Accessor<Cursor>;

	/** Cursor setter */
	setCursor: Setter<Cursor>;

	/** Pointer down state
	 * If this value is set, the pointer is down.
	 */
	ptrState?: {
		start: Pos;
		last: Pos;
	};

	/** Selected layer */
	focusedLayer: number;

	/** Current activated color */
	palette: Accessor<Palette>;

	/** Color setter */
	setPalette: Setter<Palette>;

	/** Current brush shape */
	brush: Accessor<Brush>;

	/** Current brush shape setter */
	setBrush: Setter<Brush>;

	// Canvas Refs

	/** Main layer canvas ref */
	focusedLayerRef?: HTMLCanvasElement;

	/** Above layer canvas ref */
	aboveLayerRef?: HTMLCanvasElement;

	/** Below layer canvas ref */
	belowLayerRef?: HTMLCanvasElement;

	// -- Methods

	constructor(config: PaintConfig, w: number, h: number) {
		[this.config, this.setConfig] = createSignal(config);

		this.size = { w, h };
		this.layers = [];

		this.focusedLayer = 0;

		[this.display, this.setDisplay] = createSignal({
			x: 0,
			y: 0,
			zoom: 8,
		});

		[this.cursor, this.setCursor] = createSignal({
			real: ORIGIN,
			brush: ORIGIN,
		});

		[this.palette, this.setPalette] = createSignal({
			current: rgba(255, 255, 255, 255),
			hsv: [0, 0, 1],
			history: [] as RGBA[],
		});

		[this.brush, this.setBrush] = createSignal({} as any);
		this.setBrushShape(3, true);
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

		const data = ctx.getImageData(0, 0, this.size.w, this.size.h);
		layer.data = data;
	}

	/**
	 * Change the current color
	 * @param color The color to set.
	 */
	useColor(color: RGBA) {
		this.setPalette(p => ({
			current: color,
			hsv: rgbToHSV([color[0], color[1], color[2]]),
			history: [...p.history, p.current],
		}));
	}

	/**
	 * Change the current color
	 * @param color The color to set.
	 */
	useColorHSV(color: HSV) {
		const rgb = hsvToRGB(color);
		this.setPalette(p => {
			const current = rgba(rgb[0], rgb[1], rgb[2], p.current[3]);
			return {
				current,
				hsv: color,
				history: [...p.history, p.current],
			};
		});
	}

	/** invertTransform */
	invertTransform(x: number, y: number): [number, number] {
		const d = this.display();
		return [(x - d.x) / d.zoom, (y - d.y) / d.zoom];
	}

	// --- Cursor Methods

	/** Update real cursor position. */
	updateRealCursor(x: number, y: number) {
		this.setCursor(c => ({ ...c, real: { x, y } }));
	}

	/** Update brush cursor position
	 * @param dt The time difference in milliseconds.
	 */
	updateBrushCursorPos(dt: number) {
		const r = this.config().brushStabilization ? Math.pow(0.001, dt / 1000) : 1;
		this.setCursor(c => {
			return {
				...c,
				brush: {
					x: c.brush.x * (1 - r) + c.real.x * r,
					y: c.brush.y * (1 - r) + c.real.y * r,
				},
			};
		});
	}

	/** Get brush cursor position */
	brushCursorX() {
		return Math.floor(this.cursor().brush.x - this.brush().size.w / 2 + 0.5);
	}

	/** Get brush cursor position */
	brushCursorY() {
		return Math.floor(this.cursor().brush.y - this.brush().size.h / 2 + 0.5);
	}

	/** Set brush shape.
	 * @param size The width/height of the brush shape.
	 * @param round If true, the brush shape is a circle. Otherwise, it is a square.
	 */
	setBrushShape(size: number, round: boolean) {
		const off = Math.floor(size / 2);
		const shape = round
			? ellipsePolygon(-off, -off, size, size)
			: rectanglePolygon(-off, -off, size, size);
		this.setBrush({
			shape,
			size: {
				w: size,
				h: size,
			},
		});
	}

	// -- Canvas Draw

	drawFree(lastX: number, lastY: number, x: number, y: number) {
		const ctx = this.focusedLayerRef?.getContext("2d")!;

		const dx = x - lastX;
		const dy = y - lastY;
		console.log("drawFree", lastX, lastY, x, y);

		if (dx * dx + dy * dy < 2) return;
		this.ptrState!.last = { x, y };

		ctx.fillStyle = rgbaForStyle(this.palette().current);
		drawLineWithCallbacks(
			lastX,
			lastY,
			x,
			y,
			(x, y, l) => {
				ctx.translate(x, y);
				ctx.fill(polygonTo4SegPath2D(this.brush().shape, l - 1, 0));
				ctx.translate(-x, -y);
			},
			(x, y, l) => {
				ctx.translate(x, y);
				ctx.fill(polygonTo4SegPath2D(this.brush().shape, 0, l - 1));
				ctx.translate(-x, -y);
			},
		);
	}

	// -- Events

	pointerDown() {
		const cb = this.cursor().brush;
		const x = Math.floor(cb.x);
		const y = Math.floor(cb.y);

		this.ptrState = {
			start: { x, y },
			last: { x, y },
		};
	}

	pointerUp() {
		this.ptrState = undefined;
	}

	drawIfPointerDown() {
		if (!this.ptrState) return;

		const cb = this.cursor().brush;
		const x = Math.floor(cb.x);
		const y = Math.floor(cb.y);

		this.drawFree(this.ptrState.last.x, this.ptrState.last.y, x, y);
	}

	// -- Event Loop

	/**
	 * Last step executed timestamp in milliseconds.
	 */
	private lastStepMS = Date.now();

	/**
	 * Handle everything for the next frame.
	 */
	step() {
		const now = Date.now();
		const dt = now - this.lastStepMS;
		this.lastStepMS = now;

		this.updateBrushCursorPos(dt);
		this.drawIfPointerDown();
	}
}
