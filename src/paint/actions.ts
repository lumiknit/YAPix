/**
 * @module paint/actions
 * @description The module contains available actions, and types for edit history.
 */

import { Layer } from ".";
import { Rect } from "./types";

// -- Painting actions

/** Update the part of image of the focused layer. */
export type UpdateImgAction = {
	type: "updateImg";
	/** Where the image data was updated */
	rect: Rect;
	/** Image data for revert */
	oldImg: CanvasRenderingContext2D;
	/** New image data */
	newImg?: CanvasRenderingContext2D;
};

// -- Layer control

/** New layer */
export type NewLayerAction = {
	type: "newLayer";
	index: number;
	opt: any;
};

/** Update the layer information */
export type UpdateLayerInfoAction = {
	type: "updateLayerInfo";
	index: number;

	oldOpt: any;
	opt: any;
};

/** Delete the given layer */
export type DeleteLayerAction = {
	type: "deleteLayer";
	index: number;
	/** Layer to revert */
	layer: Layer;
};

/** Delete the given layer */
export type FocusLayerAction = {
	type: "focusLayer";
	index: number;
	oldIndex: number;
};

/** Merge the image data of an imaeg to other image */
export type MergeLayerAction = {
	type: "mergeLayer";
	dest: number;
	src: number;
	srcLayer: Layer;
	destOldImage: ImageData;
};

export type Action =
	| UpdateImgAction
	| NewLayerAction
	| UpdateLayerInfoAction
	| DeleteLayerAction
	| MergeLayerAction;
