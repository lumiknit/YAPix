import { Accessor, Setter, createSignal } from "solid-js";
import { HSV, hsvToRGB, rgbToHSV } from "solid-tiny-color";

import { RGBA, rgba } from "@/common";

export type Palette = {
	/** Current color */
	current: RGBA;

	/** HSV */
	hsv: HSV;

	/** Previous colors */
	history: RGBA[];
};

/** An object contains signal of color palette */
export type WithPaletteSignal = {
	/** Getter for Palette */
	palette: Accessor<Palette>;

	/** Setter for Palette */
	setPalette: Setter<Palette>;
};

/** Install WithPaletteSignal to the object. */
export const installPaletteSignal = <T extends object>(
	target: T,
): T & WithPaletteSignal => {
	const white = rgba(255, 255, 255, 255);
	const [palette, setPalette] = createSignal<Palette>({
		current: white,
		hsv: [0, 0, 1] as HSV,
		history: [white],
	});
	return Object.assign(target, { palette, setPalette });
};

/**
 * Change the current using color to the given RGBA.
 *
 * @param z State
 * @param rgba The RGBA to change.
 */
export const useColorRGBA = (z: WithPaletteSignal, rgba: RGBA) => {
	const hsv = rgbToHSV([rgba[0], rgba[1], rgba[2]]);
	z.setPalette(p => ({
		current: rgba,
		hsv,
		history: [...p.history.filter(c => c !== rgba), rgba],
	}));
};

/**
 * Change the current using color to the given HSV.
 *
 * @param z State
 * @param hsv The HSV to change
 */
export const useColorHSV = (z: WithPaletteSignal, hsv: HSV, alpha?: number) => {
	const rgb = hsvToRGB(hsv);
	z.setPalette(p => {
		if (alpha === undefined) alpha = p.current[3];
		const current = rgba(rgb[0], rgb[1], rgb[2], alpha);
		return {
			current,
			hsv,
			history: [...p.history.filter(c => c !== current), current],
		};
	});
};
