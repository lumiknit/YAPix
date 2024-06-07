/**
 * @module paint/actions
 * @description The module contains available actions, and types for edit history.
 */

import { Rect } from "./types";

// -- Painting actions

/** Put the part of image */
export type PutImage = {
	type: "updateImg";
	/** Layer index */
	layerIndex: number;
	/** Where the image data was updated */
	rect: Rect;
	/** Image data for revert */
	oldImg: ImageData;
	/** Overlay image data */
	overlayImg: ImageData;
};

/** Update the part of image. */
export type UpdateImgAction = {
	type: "updateImg";
	/** Layer index */
	layerIndex: number;
	/** Where the image data was updated */
	rect: Rect;
	/** Image data for revert */
	oldImg: ImageData;
	/** New image data */
	newImg: ImageData;
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
};

/** Put the image data of an imaeg to other image */
export type PutLayerAction = {
	type: "putLayer";
	dest: number;
	src: number;
};

export type Action =
	| UpdateImgAction
	| NewLayerAction
	| UpdateLayerInfoAction
	| DeleteLayerAction;
