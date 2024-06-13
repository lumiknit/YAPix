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

export const POINTER_TYPES = ["pen", "touch"] as const;

/**
 * Gesture event type.
 * - done: The state that no more gesture can be handled. This is a kind of terminal state.
 * - tap: The state which is waiting for tap event.
 * - drag: The state when dragging
 * - pinch: The state when pinching
 */
export type GestureType = "done" | "wait-tap" | "drag" | "pinch";

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
 * Transform object.
 */
export type Transform = {
	/** Translation */
	translate: Pos;

	/** Scale factor */
	scale: number;

	/** Rotation in radian */
	rotation: number;
};

const INIT_TRANSFORM: Transform = {
	translate: { ...ORIGIN },
	scale: 1,
	rotation: 0,
};

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
		translate: Pos;
	};

/** More than one finger drag event */
export type PinchGestureEvent = BaseGestureEvent & Transform;

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
	onDragEnd?: (e: DragGestureEvent) => void;

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
	 * This event will have calculated scale/rotation/translate values.
	 */
	onPinchMove?: (e: PinchGestureEvent) => void;

	/**
	 * Called when at least one pointer is up.
	 * This event will have calculated scale/rotation/translate values.
	 */
	onPinchEnd?: (e: PinchGestureEvent) => void;
};

/**
 * Gesture state object.
 * It contains the type of current gesture and extra information.
 */
export type GestureState = {
	/** The current gesture type. undefined is pointer is down but no tap event */
	type: GestureType;

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
	translate: Pos;

	/** Scale */
	scale: number;

	/** Rotation in radian */
	rotation: number;
};

export type GestureEventContext = GestureEventContextParams & {
	/** Pointer map */
	pointers: Pointers;

	/** Pointers for each types */
	typePointers: Map<PointerType, Pointers>;

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
	typePointers: new Map(
		POINTER_TYPES.map(type => [type, new Map<PointerID, Pointer>()]),
	),
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

	/**
	 * Cancel processing gesture and set the gesture state to done.
	 */
	const markGestureDone = (ptr: Pointer) => {
		if (!ctx.gesture) return;
		const g = ctx.gesture;
		try {
			switch (g.type) {
				case "drag":
					ctx.onDragEnd?.({
						...baseGestureEventFromPointer(ptr.id, Date.now()),
						translate: g.translate,
						pressure: 0,
						tiltX: 0,
						tiltY: 0,
					});
					break;
				case "pinch":
					ctx.onPinchEnd?.({
						...baseGestureEventFromPointer(ptr.id, Date.now()),
						scale: g.scale,
						rotation: g.rotation,
						translate: g.translate,
					});
					break;
			}
		} catch (e) {
			console.warn("Error: onDragEnd/onPinchEnd", ctx, e);
		}
		if (g.longPressTimeout !== undefined) {
			ct(g.longPressTimeout);
			g.longPressTimeout = undefined;
		}
		g.type = "done";
	};

	/** Callback from long press  */
	const longPressCallback = (id: PointerID) => () => {
		if (!ctx.pointers.has(id) || !ctx.gesture || ctx.gesture.type != "wait-tap")
			return;
		const ptr = ctx.pointers.get(id)!;
		const e: LongPressGestureEvent = {
			...baseGestureEventFromPointer(ptr.id, ptr.timeStamp),
			count: ctx.gesture.maxPointers,
		};
		try {
			if (ctx.onLongPress && ctx.onLongPress(e) === true) {
				// Handled. Change the gesture state to done.
				markGestureDone(ptr);
			}
		} catch (e) {
			console.warn("Error: onLongPress", ctx, e);
		}
	};

	const setEmptyGesture = (type: GestureType, ts: number): GestureState => {
		return (ctx.gesture = {
			type,
			downTS: ts,
			maxPointers: ctx.pointers.size,
			translate: ORIGIN,
			scale: 1,
			rotation: 0,
		});
	};

	const startDrag = (ptr: Pointer, e: PointerGestureEvent) => {
		const ptrs = ctx.typePointers.get(ptr.type)!.size;
		const g = ctx.gesture ?? setEmptyGesture("drag", e.timeStamp);

		// Initialize the transform
		g.translate = { ...ORIGIN };
		g.scale = 1;
		g.rotation = 0;

		console.log("Reset tr", g.translate);

		const transformEvent = { ...e, ...INIT_TRANSFORM, id: ptr.id };

		if (ptrs === 1) {
			// Drag
			try {
				if (!ctx.onDragStart || ctx.onDragStart(transformEvent) === false) {
					return;
				}
			} catch (e) {
				console.warn("Error: onDragStart", ctx, e);
			}
			g.type = "drag";
		} else {
			// Pinch
			try {
				if (!ctx.onPinchStart || ctx.onPinchStart(transformEvent) === false) {
					return;
				}
			} catch (e) {
				console.warn("Error: onPinchStart", ctx, e);
			}
			g.type = "pinch";
		}
		g.ptrType = ptr.type;

		// Reset all dragStartPos
		ctx.pointers.forEach(p => {
			p.dragStartPos = { ...p.pos };
		});
	};

	const createDragEvent = (e: PointerGestureEvent): DragGestureEvent => {
		const g = ctx.gesture!;
		const ptr = ctx.pointers.get(e.id)!;
		// Just add the translate
		g.translate = {
			x: ptr.pos.x - ptr.dragStartPos.x,
			y: ptr.pos.y - ptr.dragStartPos.y,
		}
		return {
			...e,
			translate: { ...g.translate },
		};
	};

	const createPinchEvent = (e: PointerGestureEvent): PinchGestureEvent => {
		// Calculate the transform based on the two pointers.
		// Apply order is Translate -> Rotation -> Scale
		const g = ctx.gesture!;
		const ptrs = Array.from(ctx.pointers.values());
		const p1 = ptrs[0],
			p2 = ptrs[1];
		const p1Start = p1.dragStartPos,
			p2Start = p2.dragStartPos,
			p1Now = p1.pos,
			p2Now = p2.pos;
		const dxStart = p1Start.x - p2Start.x,
			dyStart = p1Start.y - p2Start.y,
			dxNow = p1Now.x - p2Now.x,
			dyNow = p1Now.y - p2Now.y;
		// Translate. The center of two pointers.
		g.translate = {
			x: (p1Now.x + p2Now.x) / 2 - (p1Start.x + p2Start.x) / 2,
			y: (p1Now.y + p2Now.y) / 2 - (p1Start.y + p2Start.y) / 2,
		};
		// Rotation. The angle between two pointers.
		g.rotation = Math.atan2(dyNow, dxNow) - Math.atan2(dyStart, dxStart);
		// Scale. The distance between two pointers.
		g.scale = Math.hypot(dxNow, dyNow) / Math.hypot(dxStart, dyStart);
		return {
			...e,
			translate: { ...g.translate },
			scale: g.scale,
			rotation: g.rotation,
		};
	};

	/** Handle pointer release event, including pointerup and cancel. */
	const handlePointerRelease = (
		ptr: Pointer,
		rawEvent: PointerGestureEvent,
		cancelled: boolean,
	) => {
		let shouldRestartDrag = false;

		const g = ctx.gesture;
		if (g && (!g.ptrType || g.ptrType === ptr.type)) {
			const tPtrs = ctx.typePointers.get(ptr.type)!;

			switch (g.type) {
				case "wait-tap":
					// Tap cannot be occurred after cancel.
					if (cancelled) {
						markGestureDone(ptr);
						return;
					}
					if (ctx.pointers.size > 1) {
						// If there are more than one pointer, should wait for all pointers up.
						const lastChange = g.upTS || g.downTS;
						if (rawEvent.timeStamp - lastChange > TAP_MAX_INTERVAL) {
							// In this case, cannot be tap.
							markGestureDone(ptr);
						}
					} else if (ctx.onTap) {
						try {
							ctx.onTap({
								...rawEvent,
								count: g.maxPointers,
							});
						} catch (e) {
							console.warn("Error: onTap", ctx, e);
						}
					}
					break;
				case "pinch":
					// If pointers are more than 2, pinch does not finished yet.
					if (tPtrs.size > 2) {
						// Not pinch finished yet.
						break;
					}
					// Otherwise, pinch is finished, but the event should be changed into drag.
					markGestureDone(ptr);
					shouldRestartDrag = true;
					break;
				case "drag":
					// In this case, event is done.
					markGestureDone(ptr);
					break;
			}
		}

		// Remove the pointer from the map
		ctx.pointers.delete(ptr.id);
		ctx.typePointers.get(ptr.type)!.delete(ptr.id);

		if (shouldRestartDrag) {
			const otherPtr = ctx.typePointers.get(ptr.type)!.values().next().value;
			startDrag(otherPtr, rawEvent);
		}

		// If all pointers are up, clear the gesture.
		if (ctx.pointers.size <= 0) {
			ctx.gesture = undefined;
		}
	};

	handlers.pointerdown = (e: PointerEvent) => {
		// First of all, try to use raw pointer event.
		const rawEvent = createRawPointerEvent(e);

		try {
			if (ctx.onPointerDown && ctx.onPointerDown(rawEvent) === false) {
				// Pointer event is not handled.
				return;
			}
		} catch (e) {
			console.warn("Error: onPointerDown", ctx, e);
		}

		// Extract pos and type to create pointer object.
		const pos = extractPointerPos(e),
			type = guessTypeOfPointerEvent(e);

		// Check the pointer is already exists, add if not exists.
		let ptr = ctx.pointers.get(e.pointerId);
		if (ptr) {
			// Maybe the button is different
			ptr.buttons.add(e.button);
		} else {
			ptr = {
				id: e.pointerId,
				pos,
				delta: { ...ORIGIN },
				timeStamp: e.timeStamp,
				initPos: { ...pos },
				dragStartPos: { ...pos },
				type,
				buttons: new Set([e.button]),
			};
			ctx.pointers.set(e.pointerId, ptr);
			ctx.typePointers.get(type)!.set(e.pointerId, ptr);
			if (ctx.captureRef) {
				ctx.captureRef.setPointerCapture(e.pointerId);
			}
		}

		// Handling the gesture
		let g = ctx.gesture;
		if (!g) {
			// If gesture is not exists, create a new gesture.
			g = setEmptyGesture("wait-tap", e.timeStamp);

			// If long press callback exists, set the timeout for long press.
			if (ctx.onLongPress) {
				g.longPressTimeout = st(
					longPressCallback(e.pointerId),
					LONG_PRESS_DURATION,
				);
			}
		} else {
			switch (g.type) {
				case "wait-tap":
					// Then, if some pointer is up, or the interval between last downed pointer is too long,
					// It cannot be tap event.
					if (g.upTS || e.timeStamp - g.downTS > TAP_MAX_INTERVAL) {
						markGestureDone(ptr);
					}
					break;
				case "drag":
					// Already dragging. First of all, check if the pointer type is not different
					if (g.ptrType !== type) break;

					// Since the pointer count will be increased, we need to convert event to drag.
					markGestureDone(ptr);
					startDrag(ptr, rawEvent);
					break;
				case "pinch":
					// Already pinching. Do nothing.
					break;
			}
			// Update the gesture state
			g.downTS = e.timeStamp;
			g.maxPointers = Math.max(g.maxPointers, ctx.pointers.size);
		}
	};

	handlers.pointermove = (e: PointerEvent) => {
		// Trigger the raw pointer event.
		const rawEvent = createRawPointerEvent(e);
		try {
			ctx.onPointerMove?.(rawEvent);
		} catch (e) {
			console.warn("Error: onPointerMove", ctx, e);
		}

		// Find the pointer. If not found, no more thing to do.
		const ptr = ctx.pointers.get(e.pointerId);
		if (!ptr) return;

		const g = ctx.gesture;

		// Update the position
		updatePointerPosition(ptr, e);

		// Check if pointer is moved over the threshold.
		if (!ptr.moved) {
			const dx = ptr.pos.x - ptr.initPos.x,
				dy = ptr.pos.y - ptr.initPos.y;
			ptr.moved = dx * dx + dy * dy > NON_DRAG_THRESHOLD * NON_DRAG_THRESHOLD;
		}

		// If no gesute for any reason, or the pointer is not moved,
		// or the pointer type of gesture is differnt, do nothing.
		if (!g || !ptr.moved || (g.ptrType !== ptr.type && g.ptrType)) return;

		switch (g.type) {
			case "wait-tap":
				// Since at least one pointer is moved,
				// the event should be handled as drag or pinch gesture.
				startDrag(ptr, rawEvent);
				break;
			// If the gesture is drag or pinch, just process with move event handler.
			case "drag":
				if (ctx.onDragMove) {
					const dragEvent: DragGestureEvent = createDragEvent(rawEvent);
					try {
						ctx.onDragMove(dragEvent);
					} catch (e) {
						console.warn("Error: onDragMove", ctx, e);
					}
				}
				break;
			case "pinch":
				if (ctx.onPinchMove) {
					const pinchEvent: PinchGestureEvent = createPinchEvent(rawEvent);
					try {
						ctx.onPinchMove(pinchEvent);
					} catch (e) {
						console.warn("Error: onPinchMove", ctx, e);
					}
				}
				break;
		}
	};

	const pointerReleaseHandler = (cancel: boolean) => (e: PointerEvent) => {
		const rawEvent = createRawPointerEvent(e);
		try {
			ctx.onPointerUp?.(rawEvent);
		} catch (e) {
			console.warn("Error: onPointerUp", ctx, e);
		}

		// If the pointer is not found, do nothing for gesture.
		const ptr = ctx.pointers.get(e.pointerId);
		if (!ptr) return;

		updatePointerPosition(ptr, e);
		handlePointerRelease(ptr, rawEvent, cancel);
	};

	handlers.pointerup = pointerReleaseHandler(false);
	handlers.pointercancel = pointerReleaseHandler(true);

	// Add listeners
	for (const key in handlers) {
		elem.addEventListener(key, handlers[key] as any);
	}
	return () => {
		for (const key in handlers) {
			elem.removeEventListener(key, handlers[key] as any);
		}
	};
};
