import { PaintState } from ".";

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

		return z.invertTransform(originalX, originalY);
	};

	eventHandlers.pointerdown = (e: PointerEvent) => {
		const [x, y] = getPointerPos(e);
		z.pointerDown();
	};

	eventHandlers.pointermove = (e: PointerEvent) => {
		const [x, y] = getPointerPos(e);
		z.updateRealCursor(x, y);
	};

	eventHandlers.pointerup = (e: PointerEvent) => {
		const [x, y] = getPointerPos(e);
		z.pointerUp();
	};

	for (const [key, handler] of Object.entries(eventHandlers)) {
		target.addEventListener(key as any, handler as any);
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
