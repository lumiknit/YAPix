import toast from "solid-toast";

import { extractCanvasRect, putContextToContext } from "@/common";
import { Action } from "../actions";

import {
	PaintState,
	changeFocusedLayer,
	clearTempLayer,
	deleteLayer,
	getFocusedLayerCtx,
	insertNewLayer,
	rerenderLayers,
	updateFocusedLayerData,
} from ".";
import { Properties } from "solid-js/web";
import { batch } from "solid-js";

/**
 * Action apply helper for history manager
 */
export const execAction = (z: PaintState, a: Action): void | Action => {
	switch (a.type) {
		case "updateImg":
			const ctx = getFocusedLayerCtx(z);
			const { rect, newImg } = a;
			if (!newImg) {
				toast.error("Unknown error");
				console.error("exec failed: newImg is not set.");
				return;
			}
			putContextToContext(ctx, newImg, rect.x, rect.y);
			clearTempLayer(z, rect);
			return a;
		case "newLayer":
			insertNewLayer(z, a.name, a.index);
			toast.success(`New layer ${a.name} is created`);
			break;
		case "deleteLayer": {
			// Check if the layer is focused
			const [l, fc, empty] = deleteLayer(z, a.index);
			a.layer = l;
			a.focusChanged = fc;
			a.createdEmpty = empty;
			toast.success(`Layer ${l.name} is deleted`);
			return a;
		}
		case "focusLayer":
			a.oldIndex ??= z.focusedLayer();
			changeFocusedLayer(z, a.index);
			break;
		case "changeCanvasSize":
			updateFocusedLayerData(z);
			batch(() => {
				if (!a.prev) {
					a.prev = { ...z.size() };
				}
				if (!a.oldLayers) {
					a.oldLayers = [...z.layers()];
				}
				if (!a.newLayers) {
					// Convert the layers to the new size
					a.newLayers = a.oldLayers.map(l => {
						const newCtx = extractCanvasRect(getFocusedLayerCtx(z), {
							x: 0,
							y: 0,
							width: a.next.width,
							height: a.next.height,
						});
						return { ...l, ctx: newCtx };
					});
				}
				z.setSize(a.next);
				z.setLayers(a.newLayers);
			});
			rerenderLayers(z);
			break;
		default:
			throw new Error(`Unknown action type to execute: ${a.type}`);
	}
};

/**
 * Action revert helper for history manager
 */
export const revertAction = (z: PaintState, a: Action) => {
	switch (a.type) {
		case "updateImg":
			const ctx = getFocusedLayerCtx(z);
			const { rect, oldImg } = a;
			if (!oldImg) {
				toast.error("Unknown error");
				console.error("revert failed: oldImg is not set.");
				return;
			}
			a.newImg ??= extractCanvasRect(ctx, rect);
			putContextToContext(ctx, oldImg, rect.x, rect.y);
			clearTempLayer(z, rect);
			return a;
		case "newLayer":
			deleteLayer(z, a.index);
			toast.success(`Layer ${a.name} is deleted`);
			break;
		case "deleteLayer":
			{
				// Just push the layer back
				z.setLayers(ls => {
					console.log(a.layer);
					ls.splice(a.index, a.createdEmpty ? 1 : 0, a.layer!);
					console.log(a, ls);
					return ls;
				});
				// Restore focus.
				if (a.focusChanged) {
					// Set the focus to the old index
					changeFocusedLayer(z, a.index, true);
				} else if (z.focusedLayer() >= a.index) {
					// If the focused layer was moved to the left
					z.setFocusedLayer(f => f + 1);
				}
				toast.success(`Layer ${a.layer!.name} is restored`);
			}
			break;
		case "focusLayer":
			changeFocusedLayer(z, a.oldIndex!);
			break;
		case "changeCanvasSize":
			console.log("changeCanvasSize");
			batch(() => {
				z.setSize(a.prev!);
				z.setLayers(a.oldLayers!);
			});
			rerenderLayers(z);
			console.log(z.size(), z.layers());
			break;
		default:
			throw new Error(`Unknown action type to revert: ${a.type}`);
	}
};

// --- Execute helper

export const execNewLayerAndFocus = (z: PaintState, name: string) => {
	const index = z.focusedLayer() + 1;
	z.history.exec([
		{ type: "newLayer", name, index },
		{ type: "focusLayer", index },
	]);
};

export const execDeleteLayer = (z: PaintState, index: number) => {
	z.history.exec([{ type: "deleteLayer", index }]);
};

export const execFocusLayer = (z: PaintState, index: number) => {
	z.history.exec([{ type: "focusLayer", index }]);
};
