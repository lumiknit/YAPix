import { Accessor, Setter, batch, createSignal } from "solid-js";

import { Pos, ORIGIN } from "@/common";
import { WithImageInfo } from ".";

/** An object contains display information */
export type WithDisplaySignal = {
	scroll: Accessor<Pos>;
	setScroll: Setter<Pos>;
	zoom: Accessor<number>;
	setZoom: Setter<number>;
};

export const installDisplaySignal = <T extends object>(
	target: T,
): T & WithDisplaySignal => {
	const [scroll, setScroll] = createSignal<Pos>({ ...ORIGIN });
	const [zoom, setZoom] = createSignal(8);
	return Object.assign(target, { scroll, setScroll, zoom, setZoom });
};

/**
 * Calculate the invert transform position
 *
 * @param z State
 * @param x X position
 * @param y Y position
 */
export const invertDisplayTransform = (
	z: WithDisplaySignal,
	x: number,
	y: number,
): [number, number] => {
	const s = z.scroll();
	const zoom = z.zoom();
	return [(x - s.x) / zoom, (y - s.y) / zoom];
};

export const fitDisplayTo = (
	z: WithImageInfo & WithDisplaySignal,
	w: number,
	h: number,
) => {
	const canvasSize = z.size();

	// Calculate the zoom
	const zoom = Math.min(w / canvasSize.w, h / canvasSize.h) * 0.95;

	// Calculate the scroll
	const x = (w - zoom * canvasSize.w) / 2;
	const y = (h - zoom * canvasSize.h) / 2;

	// Set the values
	batch(() => {
		z.setZoom(zoom);
		z.setScroll({ x, y });
	});
};
