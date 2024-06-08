import { Accessor, createSignal, Setter } from "solid-js";
import { HSV, hsvToRGB, rgbToHSV } from "solid-tiny-color";

import { rgba, RGBA, rgbaForStyle } from "../common/color";
import { Layer } from "./layer";
import {
	Boundary,
	boundaryToRect,
	Cursor,
	Display,
	EMPTY_BOUNDARY,
	extendBoundaryByRect,
	ORIGIN,
	Pos,
	Size,
} from "./types";
import {
	drawLineWithCallbacks,
	ellipsePolygon,
	Polygon,
	polygonTo4SegPath2D,
	polygonToPath2D,
	rectanglePolygon,
} from "./polygon";
import { CompiledPaintConfig, compilePaintConfig, PaintConfig } from "./config";
import { HistoryManager } from "./action-history";
import { Action, PutImageAction, UpdateImgAction } from "./actions";
import toast from "solid-toast";

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

export class PaintState {
	// -- Config
	originalConfig: PaintConfig;
	config: Accessor<CompiledPaintConfig>;
	setConfig: Setter<CompiledPaintConfig>;

	// -- Meta Data

	/** Image size */
	size: Size;

	/** Layers. 0 is bottom. */
	layers: Layer[];

	/** Background color */
	bgColor: Accessor<RGBA>;
	setBgColor: Setter<RGBA>;

	// -- Editing state

	/** History Manager */
	history: HistoryManager<Action>;

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

	/** Temp (painting) layer canvas ref */
	tempLayerRef?: HTMLCanvasElement;

	// Ref options

	/** Show main layer.
	 * Sometimes, (e.g. with eraser tool) the original main layer should be hidden.
	 */
	showFocusedLayer: Accessor<boolean>;
	setShowFocusedLayer: Setter<boolean>;

	/** Boundary */
	tempBd: Boundary;

	// -- Methods

	constructor(config: PaintConfig, w: number, h: number) {
		this.originalConfig = config;
		[this.config, this.setConfig] = createSignal(compilePaintConfig(config));

		this.size = { w, h };
		this.layers = [];

		[this.bgColor, this.setBgColor] = createSignal(rgba(0, 0, 0, 0));

		this.history = new HistoryManager<Action>(
			this.config().maxHistory,
			this.revert.bind(this),
			this.exec.bind(this),
		);

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

		[this.showFocusedLayer, this.setShowFocusedLayer] = createSignal(true);

		this.tempBd = { ...EMPTY_BOUNDARY };
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
		const cfg = this.config();
		const r = Math.pow(cfg.brushStabFactor, dt / 1000);
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

	getTempCtx(): CanvasRenderingContext2D {
		const ref = this.tempLayerRef;
		if (!ref) throw new Error("Temp layer ref is not set.");
		return ref.getContext("2d")!;
	}

	getFocusedCtx(): CanvasRenderingContext2D {
		const ref = this.focusedLayerRef;
		if (!ref) throw new Error("Temp layer ref is not set.");
		return ref.getContext("2d")!;
	}

	drawSingleBrush(x: number, y: number) {
		const ctx = this.getTempCtx();
		console.log(ctx);

		ctx.fillStyle = rgbaForStyle(this.palette().current);
		ctx.translate(x, y);
		ctx.fill(polygonToPath2D(this.brush().shape));
		ctx.translate(-x, -y);
	}

	drawFree(lastX: number, lastY: number, x: number, y: number) {
		const ctx = this.getTempCtx();

		const dx = x - lastX - 0.5;
		const dy = y - lastY - 0.5;

		if (dx * dx + dy * dy < 1.4) return;
		this.ptrState!.last = {
			x: Math.floor(x),
			y: Math.floor(y),
		};

		const brush = this.brush();
		const shape = brush.shape;
		const brushRect = boundaryToRect(shape.bd);

		ctx.fillStyle = rgbaForStyle(this.palette().current);
		drawLineWithCallbacks(
			lastX,
			lastY,
			Math.floor(x),
			Math.floor(y),
			(x, y, l) => {
				ctx.translate(x, y);
				ctx.fill(polygonTo4SegPath2D(this.brush().shape, l - 1, 0));
				ctx.translate(-x, -y);
				this.tempBd = extendBoundaryByRect(this.tempBd, {
					x: x + brushRect.x,
					y: y + brushRect.y,
					w: l - 1 + brushRect.w,
					h: brushRect.h,
				});
			},
			(y, x, l) => {
				ctx.translate(x, y);
				ctx.fill(polygonTo4SegPath2D(this.brush().shape, 0, l - 1));
				ctx.translate(-x, -y);
				this.tempBd = extendBoundaryByRect(this.tempBd, {
					x: x + brushRect.x,
					y: y + brushRect.y,
					w: brushRect.w,
					h: l - 1 + brushRect.h,
				});
			},
		);
	}

	/** Copy the result of temp layer into the current focused layer */
	flushTempLayer() {
		// If nothing is drawn, do nothing
		if (this.tempBd.l === Infinity) return;

		const tempCtx = this.getTempCtx();
		const focusedCtx = this.focusedLayerRef?.getContext("2d")!;
		// Extract the boundary
		const rect = boundaryToRect(this.tempBd);
		const oldImg = focusedCtx.getImageData(rect.x, rect.y, rect.w, rect.h);

		focusedCtx.drawImage(
			tempCtx.canvas,
			rect.x,
			rect.y,
			rect.w,
			rect.h,
			rect.x,
			rect.y,
			rect.w,
			rect.h,
		);

		const newImg = focusedCtx.getImageData(rect.x, rect.y, rect.w, rect.h);

		// Create an action, to be able to revert
		const action: UpdateImgAction = {
			type: "updateImg",
			rect,
			oldImg,
			newImg,
		};

		// Apply action
		this.history.push([action]);

		// Clear the temp layer
		tempCtx.clearRect(rect.x, rect.y, rect.w, rect.h);
		this.tempBd = { ...EMPTY_BOUNDARY };
	}

	// -- Events

	pointerDown() {
		const cb = this.cursor().brush;
		const x = cb.x,
			y = cb.y;

		this.ptrState = {
			start: { x, y },
			last: { x: Math.floor(x), y: Math.floor(y) },
		};

		this.drawSingleBrush(Math.floor(x), Math.floor(y));
	}

	pointerUp() {
		this.ptrState = undefined;
		this.flushTempLayer();
	}

	drawIfPointerDown() {
		if (!this.ptrState) return;

		const cb = this.cursor().brush;

		this.drawFree(this.ptrState.last.x, this.ptrState.last.y, cb.x, cb.y);
	}

	// -- Main action handler

	exec(a: Action): void | Action {
		switch (a.type) {
			case "updateImg":
				const ctx = this.getFocusedCtx();
				const { rect, newImg } = a;
				console.log("putImage", rect, newImg);
				ctx.putImageData(newImg, rect.x, rect.y);
				return a;
			default:
				throw new Error(`Unknown action type: ${a}`);
		}
	}

	revert(a: Action) {
		switch (a.type) {
			case "updateImg":
				const ctx = this.getFocusedCtx();
				const { rect, oldImg } = a;
				ctx.putImageData(oldImg, rect.x, rect.y);
				break;
			default:
				throw new Error(`Unknown action type: ${a}`);
		}
	}

	// -- History manager

	applyActions(actions: Action[]) {
		this.history.exec(actions);
	}

	undo() {
		if (this.history.undo()) {
			toast.success("Undo");
		} else {
			toast.error("Nothing to undo!");
		}
	}

	redo() {
		if (this.history.redo()) {
			toast.success("Redo");
		} else {
			toast.error("Nothing to redo!");
		}
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
