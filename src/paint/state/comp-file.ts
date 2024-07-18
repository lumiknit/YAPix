/**
 * @module copm-file
 * @description PaintState methods, which is about file import / export
 */

import { batch } from "solid-js";

import { DUBU_FMT_VERSION, DubuFmt, DubuLayer } from "../dubu-fmt";
import {
	CanvasCtx2D,
	ctxFromPNGBase64,
	ctxToPNGBase64,
	getContextSize,
} from "@/common";

import { PaintState, updateFocusedLayerData } from ".";
import { Layer } from "..";

const stateLayersToDubuLayers = async (z: PaintState): Promise<DubuLayer[]> => {
	const layers: DubuLayer[] = [];
	for (const l of z.layers()) {
		const data = await ctxToPNGBase64(l.data);
		layers.push({
			...l,
			data,
			size: getContextSize(l.data),
		});
	}
	return layers;
};

/**
 * Pack into .dubu format.
 */
export const packIntoDubuFmt = async (z: PaintState): Promise<DubuFmt> => {
	updateFocusedLayerData(z);
	const dubuLayers = await stateLayersToDubuLayers(z);
	return {
		version: DUBU_FMT_VERSION,
		name: z.name,
		size: z.size(),
		layers: dubuLayers,
	};
};

export const unpackFromDubuFmt = async (z: PaintState, fmt: DubuFmt) => {
	const ctxs: CanvasCtx2D[] = [];
	for (const l of fmt.layers) {
		ctxs.push(await ctxFromPNGBase64(l.data));
	}

	batch(() => {
		z.name = fmt.name;
		z.setSize(fmt.size);

		const newLayers: Layer[] = [];
		ctxs.forEach((ctx, i) => {
			const newLayer: Layer = {
				...fmt.layers[i],
				data: ctx,
			};
			newLayers.push(newLayer);
		});
		z.setLayers(newLayers);
	});
};
