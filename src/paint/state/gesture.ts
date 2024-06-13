import {
	GestureEventContext,
	createGestureEventContext,
} from "@/common/gesture-handler";
import { PaintState, saveDisplayTransform } from ".";
import { batch } from "solid-js";

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
			const cos = Math.cos(e.rotate);
			const sin = Math.sin(e.rotate);

			const x =
				e.translate.x +
				e.scale * (cos * z.savedScroll.x - sin * z.savedScroll.y);
			const y =
				e.translate.y +
				e.scale * (sin * z.savedScroll.x + cos * z.savedScroll.y);

			batch(() => {
				z.setZoom(z.savedZoom * e.scale);
				z.setAngle(z.savedAngle + e.rotate);
				z.setScroll({ x, y });
			});
		},
	});
	return gestureCtx;
};
