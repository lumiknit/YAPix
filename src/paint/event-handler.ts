import { batch } from "solid-js";

import { Pos } from "@/common";

import {
	PaintState,
	handlePointerDown,
	handlePointerUp,
	invertDisplayTransform,
	updateRealCursorPos,
} from ".";

const MOVE_THRESHOLD = 6,
	DOUBLE_CLICK_TIME = 250,
	DOUBLE_CLICK_THRESHOLD = 16,
	LONG_PRESS_TIME = 750;

const st = window.setTimeout,
	ct = window.clearTimeout;

export type PointerID = number;
type WithPointerID = { id: PointerID };

type Pointer = {
	// Current position
	moved: boolean;
	timestamp: number;
} & WithPointerID &
	Pos;

type LongPress = {
	id: PointerID;
	u: number; // Timeout
} & Pos;

export type BaseEvent = WithPointerID & Pos & {};

type LastClick = {
	x: number;
	y: number;
	timestamp: number;
};

export type PointerEventState = {
	pointers: Map<PointerID, Pointer>;
	longPress?: LongPress;
	maxPointers: number;
	lastClick: LastClick;
};

export type EventBindInfo = {
	target: HTMLElement;
	z: PaintState;
	eventHandlers: { [key: string]: any };
};

export const mountEvents = (
	z: PaintState,
	target: HTMLElement,
): EventBindInfo => {
	const eventHandlers: { [key: string]: any } = {};

	const getPointerPos = (e: PointerEvent) => {
		const boundRect = target.getBoundingClientRect();
		const originalX = e.clientX - boundRect.left;
		const originalY = e.clientY - boundRect.top;

		return invertDisplayTransform(z, originalX, originalY);
	};

	eventHandlers.pointerdown = (e: PointerEvent) => {
		const [x, y] = getPointerPos(e);
		handlePointerDown(z);
	};

	eventHandlers.pointermove = (e: PointerEvent) => {
		const [x, y] = getPointerPos(e);
		updateRealCursorPos(z, x, y);
	};

	eventHandlers.pointerup = (e: PointerEvent) => {
		handlePointerUp(z, true);
	};

	eventHandlers.pointerleave = (e: PointerEvent) => {
		handlePointerUp(z, false);
	};

	// Wheel
	eventHandlers.wheel = (e: WheelEvent) => {
		if (e.ctrlKey || e.metaKey) {
			batch(() => {
				const d = z.scroll();
				const oldZoom = z.zoom();
				const bc = z.cursor().brush;
				const zoom = oldZoom * Math.max(0.001, 1 - e.deltaY / 100);
				const x = d.x - bc.x * (zoom - oldZoom);
				const y = d.y - bc.y * (zoom - oldZoom);
				z.setScroll({ x, y });
				z.setZoom(zoom);
			});
		} else {
			z.setScroll(d => ({
				x: d.x - e.deltaX,
				y: d.y - e.deltaY,
			}));
		}
		e.preventDefault();
	};

	for (const [key, handler] of Object.entries(eventHandlers)) {
		target.addEventListener(key, handler as any);
	}

	return {
		target,
		z,
		eventHandlers,
	};
};

export const unmountEvents = (ebi: EventBindInfo) => {
	const { target, eventHandlers } = ebi;
	Object.entries(eventHandlers).forEach(([key, handler]) => {
		target.removeEventListener(key, handler);
	});
};
