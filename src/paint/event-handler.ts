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

	eventHandlers.pointerleave = (e: PointerEvent) => {
		z.pointerUp();
	};

	// Wheel
	eventHandlers.wheel = (e: WheelEvent) => {
		if (e.ctrlKey || e.metaKey) {
			z.setDisplay(d => ({
				...d,
				zoom: z.display().zoom * (1 - e.deltaY / 100),
			}));
		} else {
			z.setDisplay(d => ({
				...d,
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
