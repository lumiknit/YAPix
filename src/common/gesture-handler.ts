/**
 * @module paint/gesture-handler
 * @description Handles pointer gesture events and dispatches them to the paint state.
 *
 * Note that paint classify pointers into the two categories: pen and touch.
 * - Pen: A pointer which cannot multitouch, and may have pressure. Mouse and stylus are examples.
 *        Also unknown pointers are classified as pen.
 * - Touch: A pointer which can multitouch, however may not have pressure. Common touches are examples.
 */

import { Modifiers, ORIGIN, Pos, getModifiers } from "@/common";

// -- Enums and Constants

/**
 * Pointer event type.
 * - "pen": Mouse, Pen, etc.
 * - "touch": Touch, etc.
 */
export type PointerType = "pen" | "touch";

/**
 * Gesture event type.
 * - none: The state which cannot be handle (e.g. event confliction / cancelled)
 * - tap: The state which is waiting for tap event.
 * - drag: The state when dragging
 * - pinch: The state when pinching
 */
export type GestureType = "none" | "tap" | "drag" | "pinch";

/** Max distance which does not considered as touch as drag. Pixels. */
const NON_DRAG_THRESHOLD = 6;

/** Max duration until the touch is not considered as tap. Milliseconds. */
const TAP_MAX_INTERVAL = 200;

/** Duration when touch event become long press. Milliseconds */
const LONG_PRESS_DURATION = 500;

const st = window.setTimeout,
	ct = window.clearTimeout;

// -- Basic types

/**
 * Pointer ID. This is the same type with the pointerId of PointerEvent.
 */
export type PointerID = number;

/**
 * Object contains pointer ID.
 */
type WithPointerID = { id: PointerID };

/**
 * Object contains timestamp.
 */
type WithTimestamp = { timeStamp: number };

/**
 * Pointer state object.
 * This object is used to store and manage the pointer state.
 */
type Pointer = WithPointerID &
	WithTimestamp & {
		/** The current position of pointer */
		pos: Pos;

		/** The position of the pointer when it is downed */
		initPos: Pos;

		/** Drag start pos */
		dragStartPos: Pos;

		/** Difference from the last move event */
		delta: Pos;

		/** The type of the pointer */
		type: PointerType;

		/** Whether the pointer has moved */
		moved?: boolean;

		/** Pressed buttons */
		buttons: Set<number>;
	};

/** Pointer map */
type Pointers = Map<PointerID, Pointer>;

/**
 * Extra information for tap/long press event.
 */
export type PressEventExtra = {
	/**
	 * The max number of pointer before the event occurred.
	 * For example, three finger tap will have count of 3.
	 */
	count: number;
};

/**
 * Extra information for pointer event with single pointer, such as drag.
 */
export type SinglePointerEventExtra = {
	pressure: number;
	tiltX: number;
	tiltY: number;
};

/**
 * Base gesture event.
 */
export type BaseGestureEvent = WithPointerID &
	WithTimestamp & {
		/** Map of pointers */
		pointers: Pointers;

		/** Modifier keys */
		modifiers: Modifiers;

		/** Button */
		button: number;
	};

/** Event for raw pointer event */
export type PointerGestureEvent = BaseGestureEvent & SinglePointerEventExtra;

/** Tap gesture event, including multi-finger tap */
export type TapGestureEvent = BaseGestureEvent & PressEventExtra;

/** Long press event */
export type LongPressGestureEvent = BaseGestureEvent & PressEventExtra;

/** One finger drag event */
export type DragGestureEvent = BaseGestureEvent &
	SinglePointerEventExtra & {
		translation: Pos;
	};

/** More than one finger drag event */
export type PinchGestureEvent = BaseGestureEvent & {
	scale: number;
	rotation: number;
	translation: Pos;
};

// -- Context

/**
 * Parameters to create a gesture event context.
 */
export type GestureEventContextParams = {
	// Configs

	/**
	 * The element to caputre all pointer events if specified.
	 */
	captureRef?: HTMLElement;

	// Raw handlers

	/**
	 * Called when a pointer is down.
	 * If it returns false, the pointer will not be handled.
	 *
	 * @param e The pointer event.
	 */
	onPointerDown?: (e: PointerGestureEvent) => void | boolean;

	/**
	 * Called when a pointer is moved.
	 */
	onPointerMove?: (e: PointerGestureEvent) => void;

	/**
	 * Called when a pointer is up.
	 */
	onPointerUp?: (e: PointerGestureEvent) => void;

	/**
	 * Called when a pointer is canceled.
	 */
	onPointerCancel?: (e: PointerGestureEvent) => void;

	// Touch Handlers

	/**
	 * Called when a pointer is clicked.
	 * More specifically, it is called after every pointers are up almost at the same time.
	 */
	onTap?: (e: TapGestureEvent) => void;

	/**
	 * Called when a pointer is long-pressed.
	 * If it returns false, another gesture event (such as drag) can be handled.
	 *
	 * @param e The long press event.
	 * @returns True if the event after long press should be canceled. False otherwise.
	 */
	onLongPress?: (e: LongPressGestureEvent) => void | boolean;

	/**
	 * Called when a pointer is dragged.
	 */
	onDragStart?: (e: DragGestureEvent) => void | boolean;

	/**
	 * Called when a pointer is moved.
	 */
	onDragMove?: (e: DragGestureEvent) => void;

	/**
	 * Called when a pointer is up.
	 */
	onDragEnd?: (e?: DragGestureEvent) => void;

	/**
	 * Called when at least two pointers are pressed and start to moved.
	 * If it is undefined or returns false, the pinch event will not be handled.
	 *
	 * @param e The pinch event.
	 * @returns False if the pinch event should not be handled.
	 */
	onPinchStart?: (e: PinchGestureEvent) => void | boolean;

	/**
	 * Called when more than two pointers are moved.
	 * This event will have calculated scale/rotation/translation values.
	 */
	onPinchMove?: (e: PinchGestureEvent) => void;

	/**
	 * Called when at least one pointer is up.
	 * This event will have calculated scale/rotation/translation values.
	 */
	onPinchEnd?: (e?: PinchGestureEvent) => void;
};

/**
 * Gesture state object.
 * It contains the type of current gesture and extra information.
 */
export type GestureState = {
	/** The current gesture type. undefined is pointer is down but no tap event */
	type?: GestureType;

	/** Pointer type. This when the gesture is determined (e.g. drag, pinch) */
	ptrType?: PointerType;

	/** The time when the first pointer is downed */
	downTS: number;

	/** The time when the last pointer is upped */
	upTS?: number;

	/** The max number of pointers */
	maxPointers: number;

	/** The long press timeout */
	longPressTimeout?: number;

	// Drag / pinch

	/** Translation */
	translation: Pos;

	/** Scale */
	scale: number;

	/** Rotation in radian */
	rotation: number;
};

export type GestureEventContext = GestureEventContextParams & {
	/** Pointer map */
	pointers: Pointers;

	/** Gesture information */
	gesture?: GestureState;
};

/**
 * Create a gesture event context.
 *
 * @param base The base context parameters.
 */
export const createGestureEventContext = (
	base: GestureEventContextParams,
): GestureEventContext => ({
	...base,
	pointers: new Map(),
});

// -- Helpers

/**
 * Guess the type of the pointer event.
 *
 * @param e The pointer event.
 * @returns The type of the pointer.
 */
const guessTypeOfPointerEvent = (e: PointerEvent): PointerType =>
	e.pointerType === "touch" ? "touch" : "pen";

/**
 * Extract the pointer position from event.
 *
 * @param e The pointer event.
 * @returns The position of the pointer.
 */
const extractPointerPos = (e: PointerEvent): Pos => ({
	x: e.clientX,
	y: e.clientY,
});

// -- Main mount function

/**
 * Add gesture listeners to the element.
 *
 * @param elem The element to add listeners.
 * @param ctx The context to handle events.
 * @returns A function to remove listeners.
 */
export const addGestureListeners = (
	elem: HTMLElement,
	ctx: GestureEventContext,
) => {
	const handlers: { [key: string]: (e: PointerEvent) => void } = {};

	/**
	 * Convert the pointer event to raw pointer event.
	 */
	const baseGestureEventFromPointer = (
		id: PointerID,
		timeStamp: number,
	): BaseGestureEvent => ({
		id: id,
		timeStamp,
		pointers: ctx.pointers,
		modifiers: {},
		button: -1,
	});

	/**
	 * Create raw PointerGestureEvent from PointerEvent.
	 */
	const createRawPointerEvent = (e: PointerEvent): PointerGestureEvent => ({
		...baseGestureEventFromPointer(e.pointerId, e.timeStamp),
		modifiers: getModifiers(e),
		button: e.button,
		pressure: e.pressure,
		tiltX: e.tiltX,
		tiltY: e.tiltY,
	});

	/** Update the position */
	const updatePointerPosition = (ptr: Pointer, e: PointerEvent) => {
		const lastPos = ptr.pos;
		ptr.pos = extractPointerPos(e);
		ptr.delta = {
			x: ptr.pos.x - lastPos.x,
			y: ptr.pos.y - lastPos.y,
		};
	};

	/** Cancel working gesture and reset to none */
	const cancelGesture = () => {
		if (!ctx.gesture) return;
		const g = ctx.gesture;
		switch (g.type) {
			case "drag":
				ctx.onDragEnd?.();
				break;
			case "pinch":
				ctx.onPinchEnd?.();
				break;
		}
		if (g.longPressTimeout !== undefined) {
			ct(g.longPressTimeout);
			g.longPressTimeout = undefined;
		}
		g.type = "none";
	};

	/** Callback from long press  */
	const longPressCallback = (id: PointerID) => () => {
		if (!ctx.pointers.has(id) || !ctx.gesture || ctx.gesture.type != "tap")
			return;
		const ptr = ctx.pointers.get(id)!;
		const e: LongPressGestureEvent = {
			id,
			timeStamp: ptr.timeStamp,
			pointers: ctx.pointers,
			modifiers: {},
			count: ctx.pointers.size,
			button: -1,
		};
		if (ctx.onLongPress && ctx.onLongPress(e) === true) {
			cancelGesture();
		} else {
			ctx.gesture.type = undefined;
		}
	};

	const setEmptyGesture = (ts: number): GestureState => {
		return (ctx.gesture = {
			downTS: ts,
			maxPointers: ctx.pointers.size,
			translation: ORIGIN,
			scale: 1,
			rotation: 0,
		});
	};

	/**
	 * Change the pointer type, and release some pointers with different type.
	 */
	const changePointerType = (type: PointerType, ts: number) => {
		const g = ctx.gesture;
		if (!g || g.ptrType === type) return;
		g.ptrType = type;
		for (const id of ctx.pointers.keys()) {
			const ptr = ctx.pointers.get(id)!;
			if (ptr.type !== ctx.gesture?.ptrType) {
				const rawEvent = baseGestureEventFromPointer(ptr, ts);
				handlePointerRelease(id, rawEvent, true);
			}
		}
	};

	const startDrag = (e: PointerEvent) => {
		const ptrs = ctx.pointers.size;
		const g = ctx.gesture ?? setEmptyGesture(e.timeStamp);
		const rawEvent = createRawPointerEvent(e);

		if (ptrs === 1) {
			// Drag
			if (
				!ctx.onDragStart ||
				ctx.onDragStart({
					...rawEvent,
					translation: ORIGIN,
				}) === false
			) {
				return;
			}
			g.type = "drag";
		} else {
			// Pinch
			if (
				!ctx.onPinchStart ||
				ctx.onPinchStart({
					...rawEvent,
					scale: 1,
					rotation: 0,
					translation: ORIGIN,
				}) === false
			) {
				return;
			}
			g.type = "pinch";
		}
		g.ptrType = guessTypeOfPointerEvent(e);
	};

	/** Handle pointer release event, including pointerup and cancel. */
	const handlePointerRelease = (
		id: PointerID,
		baseEvent: BaseGestureEvent,
		cancelled: boolean,
	) => {
		const g = ctx.gesture;
		if (g) {
			console.log(g);
			switch (g.type) {
				case "tap":
					// Tap cannot be occurred after cancel.
					if (cancelled) {
						cancelGesture();
						return;
					}
					if (ctx.pointers.size > 1) {
						// In this case, we need to wait for another pointer up.
						const lastChange = g.upTS || g.downTS;
						if (baseEvent.timeStamp - lastChange > TAP_MAX_INTERVAL) {
							// In this case, cannot be tap.
							cancelGesture();
						}
					} else if (ctx.onTap) {
						ctx.onTap({
							...baseEvent,
							count: g.maxPointers,
						});
					}
					break;
				case "pinch":
					if (ctx.pointers.size > 2) {
						// Not pinch finished yet.
						break;
					}
				case "drag":
					cancelGesture();
					// Change to drag if the pointer is only one.
					if (ctx.pointers.size === 2) {
						g.type = "drag";
						if (ctx.onDragStart && ctx.onDragStart(rawEvent) === false) {
							cancelGesture();
						}
					}
					break;
			}
		}

		// Remove the pointer from the map
		ctx.pointers.delete(ptr.id);

		if (ctx.pointers.size <= 0) {
			ctx.gesture = undefined;
			resetEventInfo();
		}
	};

	handlers.pointerdown = (e: PointerEvent) => {
		const pos = extractPointerPos(e),
			type = guessTypeOfPointerEvent(e);

		let ptr = ctx.pointers.get(e.pointerId);
		if (ptr) {
			// Maybe the button is different
			ptr.buttons.add(e.button);
		} else {
			const newPtr: Pointer = {
				id: e.pointerId,
				pos,
				delta: { ...ORIGIN },
				timeStamp: e.timeStamp,
				initPos: { ...pos },
				dragStartPos: { ...pos },
				type,
				buttons: new Set([e.button]),
			};
			ctx.pointers.set(e.pointerId, newPtr);
			ptr = newPtr;
		}

		const rawEvent = createRawPointerEvent(e);

		if (ctx.onPointerDown && ctx.onPointerDown(rawEvent) === false) {
			// Pointer event is not handled.
			return;
		}

		if (ctx.captureRef) {
			ctx.captureRef.setPointerCapture(e.pointerId);
		}

		let g = ctx.gesture;
		if (!g) {
			g = setEmptyGesture(e.timeStamp);
			if (ctx.onPointerDown) g.type = "tap";
			if (ctx.onLongPress) {
				g.longPressTimeout = st(
					longPressCallback(e.pointerId),
					LONG_PRESS_DURATION,
				);
			}
			console.log("TAP");
		} else {
			switch (g.type) {
				case undefined:
				case "tap":
					// Compare with the last pointer changes.
					if (g.upTS || e.timeStamp - g.downTS > TAP_MAX_INTERVAL) {
						// If the time is passed, reset the gesture.
						cancelGesture();
					}
					break;
				case "drag":
					// In this case, event should be changed into pinch.
					if (ctx.pointers.size > 1 && ctx.onPinchStart) {
						cancelGesture();
						g.type = "pinch";
						const pinchEvent: PinchGestureEvent = {
							...rawEvent,
							scale: 1,
							rotation: 0,
							translation: ORIGIN,
						};
						if (ctx.onPinchStart(pinchEvent) === false) {
							cancelGesture();
						}
					}
					break;
				default:
					// If another gesture is working, reset the gesture.
					cancelGesture();
			}
			g.downTS = e.timeStamp;
			g.maxPointers = Math.max(g.maxPointers, ctx.pointers.size);
		}
	};

	handlers.pointermove = (e: PointerEvent) => {
		// Find the pointer. If not found, ignore the event.
		const ptr = ctx.pointers.get(e.pointerId);
		if (!ptr) return;

		// Update the position
		updatePointerPosition(ptr, e);
		const rawEvent = createRawPointerEvent(e);

		ctx.onPointerMove?.(rawEvent);

		if (!ptr.moved) {
			const dx = ptr.pos.x - ptr.initPos.x,
				dy = ptr.pos.y - ptr.initPos.y;
			ptr.moved = dx * dx + dy * dy > NON_DRAG_THRESHOLD * NON_DRAG_THRESHOLD;
		}

		// Update gestures

		const g = ctx.gesture;
		if (!g || !ptr.moved) return;

		// If another type of pointer has been handled as gesture, ignore the current event.
		if (g.ptrType !== ptr.type && !g) return;

		switch (g.type) {
			case undefined:
			case "tap":
				startDrag(e);
				break;
			case "drag":
				if (ctx.onDragMove) {
					ctx.onDragMove(rawEvent);
				}
				break;
			case "pinch":
				if (ctx.onPinchMove) {
					ctx.onPinchMove(rawEvent);
				}
				break;
		}
	};

	handlers.pointerup = (e: PointerEvent) => {
		const ptr = ctx.pointers.get(e.pointerId);
		if (!ptr) return;

		const rawEvent = createRawPointerEvent(e);

		updatePointerPosition(ptr, e);

		ctx.onPointerUp?.(rawEvent);

		handlePointerRelease(ptr.id, rawEvent, false);
	};

	handlers.pointercancel = (e: PointerEvent) => {
		const ptr = ctx.pointers.get(e.pointerId);
		if (!ptr) return;

		updatePointerPosition(ptr, e);

		const rawEvent = createRawPointerEvent(e);

		ctx.onPointerCancel?.(rawEvent);

		handlePointerRelease(ptr.id, rawEvent, true);
	};

	// Add listeners
	for (const [key, handler] of Object.entries(handlers)) {
		elem.addEventListener(key, handler as any);
	}
	return () => {
		for (const [key, handler] of Object.entries(handlers)) {
			elem.removeEventListener(key, handler as any);
		}
	};
};
