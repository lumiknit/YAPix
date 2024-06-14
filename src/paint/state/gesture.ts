import {
	GestureEventContext,
	createGestureEventContext,
} from "@/common/gesture-handler";
import {
	PaintState,
	restoreDisplayTransform,
	rotateScaleDisplayByCenter,
	saveDisplayTransform,
	transformOverDisplay,
} from ".";
import { addPos } from "@/common";
import toast from "solid-toast";

export const createPaintGestureContext = (
	z: PaintState,
): GestureEventContext => {
	const gestureCtx = createGestureEventContext({
		captureRef: z.rootRef!,
		onPointerDown(e) {},
		onPointerMove(e) {},
		onPointerUp(e) {},
		onPointerCancel(e) {},
		onTap(e) {
			rotateScaleDisplayByCenter(z, 0.5, 1);
		},
		onLongPress(e) {},
		onDragStart(e) {
			saveDisplayTransform(z);
		},
		onDragMove(e) {
			z.setScroll(s => addPos(z.savedScroll, e.translate));
		},
		onDragEnd(e) {},

		// Pinch is only used for transform
		onPinchStart() {
			// Save the last display state
			saveDisplayTransform(z);
		},
		onPinchMove(e) {
			// Update the display state based on the pinch gesture
			// Translate should be invert transformed and re-transformed
			restoreDisplayTransform(z);
			transformOverDisplay(z, e.scale, e.rotate, e.translate);
		},
	});
	return gestureCtx;
};
