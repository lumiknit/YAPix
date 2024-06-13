import {
	GestureEventContext,
	createGestureEventContext,
} from "@/common/gesture-handler";
import {
	PaintState,
	restoreDisplayTransform,
	saveDisplayTransform,
	transformOverDisplay,
} from ".";

export const createPaintGestureContext = (
	z: PaintState,
): GestureEventContext => {
	const gestureCtx = createGestureEventContext({
		captureRef: z.rootRef!,
		onPointerDown(e) {},
		onPointerMove(e) {},
		onPointerUp(e) {},
		onPointerCancel(e) {},
		onTap(e) {},
		onLongPress(e) {},
		onDragStart(e) {
			saveDisplayTransform(z);
		},
		onDragMove(e) {
			z.setScroll({
				x: z.savedScroll.x + e.translate.x,
				y: z.savedScroll.y + e.translate.y,
			});
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
