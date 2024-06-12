import { Accessor, batch, createSignal, Setter } from "solid-js";
import { HSV, hsvToRGB, rgbToHSV, rgbToStyle } from "solid-tiny-color";

import { rgba, RGBA, rgbaForStyle,
	Boundary,
	boundaryToRect,
	EMPTY_BOUNDARY,
	extendBoundaryByRect,
	limitBoundaryToOriginRect,
	ORIGIN,
	Pos,
	Rect,
	Size,
} from "../common";

import { Layer, createEmptyLayer, drawLayerToCanvas } from "./layer";
import {
	Cursor,
	DrawShape,
	ERASER_TYPE_TOOLS,
	ToolType,
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
import { Action, UpdateImgAction } from "./actions";
import toast from "solid-toast";
import { emptyCanvasContext, extractCanvasRect, putContextToContext } from ".";

export type Brush = {
	/** Brush shape */
	shape: Polygon;

	/** Size */
	size: Size;

	/** Roundness */
	round: boolean;
};

export type BrushSet = Map<ToolType, Brush>;

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
	bgColor: RGBA;

	// -- Editing state

	/** History Manager */
	history: HistoryManager<Action>;

	/** Displayed canvas offset */
	scroll: Accessor<Pos>;

	/** Displayed canvas offset setter */
	setScroll: Setter<Pos>;

	/** Displayed canvas zoom */
	zoom: Accessor<number>;

	/** Displayed canvas zoom setter */
	setZoom: Setter<number>;

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
	brushSet: Accessor<BrushSet>;

	/** Current brush shape setter */
	setBrushSet: Setter<BrushSet>;

	/** Current draw shape */
	drawShape: Accessor<DrawShape>;

	/** Set current draw shape */
	setDrawShape: Setter<DrawShape>;

	/** Current tool */
	tool: Accessor<ToolType>;

	/** Set current tool */
	setTool: Setter<ToolType>;

	// Canvas Refs

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
		this.layers = [createEmptyLayer("Layer 1", w, h)];

		this.bgColor = rgba(0, 0, 0, 0);

		this.history = new HistoryManager<Action>(
			this.config().maxHistory,
			this.revert.bind(this),
			this.exec.bind(this),
		);

		this.focusedLayer = 0;

		[this.scroll, this.setScroll] = createSignal({ ...ORIGIN });
		[this.zoom, this.setZoom] = createSignal(8);

		[this.cursor, this.setCursor] = createSignal({
			real: ORIGIN,
			brush: ORIGIN,
		});

		[this.palette, this.setPalette] = createSignal({
			current: rgba(255, 255, 255, 255),
			hsv: [0, 0, 1],
			history: [] as RGBA[],
		});
		this.useColor(this.palette().current);

		[this.tool, this.setTool] = createSignal<ToolType>("brush");

		[this.brushSet, this.setBrushSet] = createSignal(new Map(), {
			equals: false,
		});
		this.setBrushShape(3, true);

		[this.drawShape, this.setDrawShape] = createSignal<DrawShape>("free");

		[this.showFocusedLayer, this.setShowFocusedLayer] = createSignal(true);

		this.tempBd = { ...EMPTY_BOUNDARY };
	}

	init() {
		this.renderBlurredLayer();
		this.fitCanvasToRoot();
	}

	// -- Layers

	/**
	 * Convert the whole layers into a single canvas.
	 */
	exportImage(scale: number): CanvasRenderingContext2D {
		this.updateFocusedLayerData();

		const ectx = emptyCanvasContext(this.size.w, this.size.h);
		for (let i = 0; i < this.layers.length; i++) {
			drawLayerToCanvas(ectx, this.layers[i]);
		}
		scale = Math.min(1, Math.floor(scale));
		if (scale <= 1) return ectx;

		const ctx = emptyCanvasContext(this.size.w * scale, this.size.h * scale);
		ctx.scale(scale, scale);
		ctx.imageSmoothingEnabled = false;
		ctx.imageSmoothingQuality = "low";
		ctx.drawImage(ectx.canvas, 0, 0);
		return ctx;
	}

	/**
	 * Render the bottom and top layer. This will refresh the bottom and top layer canvas
	 * with background color and layers below the focused layer.
	 */
	renderBlurredLayer() {
		const ctx = this.belowLayerRef?.getContext("2d");
		if (!ctx) return;

		ctx.globalCompositeOperation = "source-over";

		const cfg = this.config();

		// If background color is transparent, fill the canvas with checkerboard
		if (this.bgColor[3] < 255) {
			ctx.fillStyle = rgbToStyle(cfg.bgCheckerboard.color1);
			ctx.fillRect(0, 0, this.size.w, this.size.h);
			ctx.fillStyle = rgbToStyle(cfg.bgCheckerboard.color2);
			for (let y = 0; y < this.size.h; y += cfg.bgCheckerboard.size) {
				for (
					let x = ((y / cfg.bgCheckerboard.size) % 2) * cfg.bgCheckerboard.size;
					x < this.size.w;
					x += 2 * cfg.bgCheckerboard.size
				) {
					ctx.fillRect(x, y, cfg.bgCheckerboard.size, cfg.bgCheckerboard.size);
				}
			}
		}

		// Draw background color
		ctx.fillStyle = rgbaForStyle(this.bgColor);
		ctx.fillRect(0, 0, this.size.w, this.size.h);

		// Then, draw layers below the focused layer
		for (let i = 0; i < this.focusedLayer; i++) {
			drawLayerToCanvas(ctx, this.layers[i]);
		}

		// Render for the top layer
		const topCtx = this.aboveLayerRef?.getContext("2d");
		if (!topCtx) return;
		topCtx.clearRect(0, 0, this.size.w, this.size.h);
		topCtx.globalCompositeOperation = "source-over";
		for (let i = this.focusedLayer + 1; i < this.layers.length; i++) {
			drawLayerToCanvas(topCtx, this.layers[i]);
		}
	}

	/** Update focused layer data with current context */
	private updateFocusedLayerData() {
		const ctx = this.getFocusedCtx();
		this.layers[this.focusedLayer].data.clearRect(
			0,
			0,
			this.size.w,
			this.size.h,
		);
		this.layers[this.focusedLayer].data.drawImage(ctx.canvas, 0, 0);
	}

	// -- Color

	/**
	 * Change the current color
	 * @param color The color to set.
	 */
	useColor(color: RGBA) {
		this.setPalette(p => ({
			current: color,
			hsv: rgbToHSV([color[0], color[1], color[2]]),
			history: [...p.history, color],
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
				history: [...p.history, current],
			};
		});
	}

	/**
	 * Change the current color from history.
	 *
	 * @param index The index of the history. If negative, it will be the index from the end.
	 */
	useColorFromHistory(index: number) {
		this.setPalette(p => {
			console.log("index", index, p.history.length);
			if (index < 0) index = p.history.length + index;
			if (index < 0 || index >= p.history.length) return p;
			const color = p.history[index];
			p.history.splice(index, 1);
			p.history.push(color);
			return {
				current: color,
				hsv: rgbToHSV([color[0], color[1], color[2]]),
				history: p.history,
			};
		});
	}

	// -- Display

	/** Update scroll and zoom to fit the canvas to the root div. */
	fitCanvasToRoot() {
		const root = this.rootRef!;
		// Get the size
		const w = root.offsetWidth;
		const h = root.offsetHeight;
		// Calculate the zoom
		const zoom = Math.min(w / this.size.w, h / this.size.h) * 0.95;
		// Calculate the scroll
		const x = (w - this.size.w * zoom) / 2;
		const y = (h - this.size.h * zoom) / 2;
		// Set the values
		batch(() => {
			this.setZoom(zoom);
			this.setScroll({ x, y });
		});
	}

	/** invertTransform */
	invertTransform(x: number, y: number): [number, number] {
		const d = this.scroll();
		const z = this.zoom();
		return [(x - d.x) / z, (y - d.y) / z];
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
		if (!this.ptrState) {
			// Teleport
			this.setCursor(c => ({ ...c, brush: c.real }));
		} else {
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
	}

	/** Get current brush for current tool */
	brush(): Brush {
		const tool = this.tool();
		let brush = this.brushSet().get(tool);
		if (!brush) {
			brush = this.setBrushShape(1, true);
		}
		return brush;
	}

	/** Get brush cursor position */
	brushCursorPos(): Pos {
		const cur = this.cursor();
		const b = this.brush();
		return {
			x: Math.round(cur.brush.x - b.size.w / 2),
			y: Math.round(cur.brush.y - b.size.h / 2),
		};
	}

	/** Get brushPos, the center pixel of with current cursor.
	 * If floor each axis, it will be the top-left corner of the center pixel.
	 */
	brushPos(): Pos {
		const b = this.brush();
		const cb = this.cursor().brush;
		return {
			x: cb.x - (b.shape.bd.r + b.shape.bd.l - 1) / 2,
			y: cb.y - (b.shape.bd.b + b.shape.bd.t - 1) / 2,
		};
	}

	/** Set brush shape.
	 * @param size The width/height of the brush shape.
	 * @param round If true, the brush shape is a circle. Otherwise, it is a square.
	 */
	setBrushShape(size: number, round: boolean): Brush {
		const off = Math.floor(size / 2);
		const shape = round
			? ellipsePolygon(-off, -off, size, size)
			: rectanglePolygon(-off, -off, size, size);
		const brush = {
			shape,
			size: {
				w: size,
				h: size,
			},
			round,
		};
		const tool = this.tool();
		this.setBrushSet(b => b.set(tool, brush));
		return brush;
	}

	// -- Tool

	useTool(tool: ToolType) {
		batch(() => {
			this.setTool(tool);

			const eraserType = ERASER_TYPE_TOOLS.has(tool);
			this.setShowFocusedLayer(!eraserType);
		});

		// Clear the temp layer
		this.clearTempLayer({
			x: 0,
			y: 0,
			w: this.size.w,
			h: this.size.h,
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

	/**
	 * Clear the temp layer boundary.
	 * The clear method will different by which tool is selected.
	 *
	 * @param rect The rectangle to clear.
	 */
	clearTempLayer(rect: Rect) {
		const tool = this.tool();
		const ctx = this.getTempCtx();
		ctx.clearRect(rect.x, rect.y, rect.w, rect.h);

		if (ERASER_TYPE_TOOLS.has(tool)) {
			// In this case, copy the contents from the focused layer
			const focusedCtx = this.getFocusedCtx();
			const oldComposite = ctx.globalCompositeOperation;
			ctx.globalCompositeOperation = "source-over";
			ctx.drawImage(
				focusedCtx.canvas,
				rect.x,
				rect.y,
				rect.w,
				rect.h,
				rect.x,
				rect.y,
				rect.w,
				rect.h,
			);
			ctx.globalCompositeOperation = oldComposite;
		}
	}

	/**
	 * Set the fill style & stroke style for the tool.
	 */
	private updateToolStyle(ctx: CanvasRenderingContext2D) {
		switch (this.tool()) {
			// Use current color, with source-over
			case "brush":
				ctx.strokeStyle = ctx.fillStyle = rgbaForStyle(this.palette().current);
				ctx.globalCompositeOperation = "source-over";
				break;
			// Use fixed color, with source-over
			case "select":
				ctx.strokeStyle = ctx.fillStyle = rgbaForStyle(rgba(255, 0, 0, 128));
				ctx.globalCompositeOperation = "source-over";
				break;
			// Use fixed color, by erasing
			case "eraser":
			case "deselect":
				ctx.strokeStyle = ctx.fillStyle = rgbaForStyle(rgba(255, 0, 0, 255));
				ctx.globalCompositeOperation = "destination-out";
				break;
			// Otherwise, do not need to update settings.
		}
	}

	private drawSingleBrush(x: number, y: number) {
		const ctx = this.getTempCtx();

		ctx.save();
		this.updateToolStyle(ctx);
		ctx.translate(x, y);
		ctx.fill(polygonToPath2D(this.brush().shape));
		ctx.restore();
	}

	private drawFree(lastX: number, lastY: number, x: number, y: number) {
		const ctx = this.getTempCtx();

		const dx = x - lastX;
		const dy = y - lastY;

		if (dx * dx + dy * dy < 1.4) return;
		const fx = Math.floor(x),
			fy = Math.floor(y);
		this.ptrState!.last = {
			x: fx,
			y: fy,
		};

		const brush = this.brush();
		const shape = brush.shape;
		const brushRect = boundaryToRect(shape.bd);

		ctx.save();
		this.updateToolStyle(ctx);
		let lx = 0,
			ly = 0;
		drawLineWithCallbacks(
			lastX,
			lastY,
			fx,
			fy,
			(x, y, l) => {
				ctx.translate(x - lx, y - ly);
				(lx = x), (ly = y);
				ctx.fill(polygonTo4SegPath2D(this.brush().shape, l - 1, 0));
				this.tempBd = extendBoundaryByRect(this.tempBd, {
					x: x + brushRect.x,
					y: y + brushRect.y,
					w: l - 1 + brushRect.w,
					h: brushRect.h,
				});
			},
			(y, x, l) => {
				ctx.translate(x - lx, y - ly);
				(lx = x), (ly = y);
				ctx.fill(polygonTo4SegPath2D(this.brush().shape, 0, l - 1));
				this.tempBd = extendBoundaryByRect(this.tempBd, {
					x: x + brushRect.x,
					y: y + brushRect.y,
					w: brushRect.w,
					h: l - 1 + brushRect.h,
				});
			},
		);
		ctx.restore();
	}

	/** Copy the result of temp layer into the current focused layer */
	private flushTempLayer() {
		// If nothing is drawn, do nothing
		if (this.tempBd.l === Infinity) return;

		const tool = this.tool();
		const tempCtx = this.getTempCtx();
		const focusedCtx = this.focusedLayerRef?.getContext("2d")!;
		// Extract the boundary
		const bd = limitBoundaryToOriginRect(this.tempBd, this.size.w, this.size.h);
		// Bound to the canvas
		const rect = boundaryToRect(bd);
		const oldImg = extractCanvasRect(focusedCtx, rect);

		if (ERASER_TYPE_TOOLS.has(tool)) {
			focusedCtx.clearRect(rect.x, rect.y, rect.w, rect.h);
		}

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

		// Create an action, to be able to revert
		const action: UpdateImgAction = {
			type: "updateImg",
			rect,
			oldImg,
		};

		// Apply action
		this.history.push([action]);

		// Clear the temp layer
		this.clearTempLayer(rect);
		this.tempBd = { ...EMPTY_BOUNDARY };
	}

	// -- Events

	pointerDown() {
		const pos = this.brushPos();

		const x = Math.floor(pos.x),
			y = Math.floor(pos.y);

		this.ptrState = {
			start: { ...pos },
			last: { x, y },
		};

		this.drawSingleBrush(x, y);
	}

	pointerUp(buttonDown: boolean) {
		if (buttonDown) {
			const pos = this.brushPos();
			this.drawSingleBrush(Math.floor(pos.x), Math.floor(pos.y));
		}

		this.ptrState = undefined;
		this.flushTempLayer();
	}

	drawIfPointerDown() {
		if (!this.ptrState) return;

		const pos = this.brushPos();

		this.drawFree(this.ptrState.last.x, this.ptrState.last.y, pos.x, pos.y);
	}

	// -- Main action handler

	exec(a: Action): void | Action {
		switch (a.type) {
			case "updateImg":
				const ctx = this.getFocusedCtx();
				const { rect, newImg } = a;
				if (!newImg) {
					toast.error("Unknown error");
					console.error("exec failed: newImg is not set.");
					return;
				}
				putContextToContext(ctx, newImg, rect.x, rect.y);
				this.clearTempLayer(rect);
				return a;
			default:
				throw new Error(`Unknown action type: ${a}`);
		}
	}

	revert(a: Action) {
		switch (a.type) {
			case "updateImg":
				const ctx = this.getFocusedCtx();
				const { rect, oldImg, newImg } = a;
				if (!newImg) {
					// Keep the current image to revert
					a.newImg = extractCanvasRect(ctx, rect);
				}
				putContextToContext(ctx, oldImg, rect.x, rect.y);
				this.clearTempLayer(rect);
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
		if (!this.history.undo()) {
			toast.error("Nothing to undo!");
		}
	}

	redo() {
		if (!this.history.redo()) {
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
