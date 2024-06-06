export type RGBA = Uint8ClampedArray; // r, g, b, a: 0-255

/**
 * RGBA Constructor
 */
export const rgba = (r: number, g: number, b: number, a: number): RGBA =>
	new Uint8ClampedArray([r, g, b, a]);

/**
 * Convert RGBA to style color string
 */
export const rgbaForStyle = (rgba: RGBA): string =>
	`rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3] / 255})`;

/**
 * Normal mode blending.
 * @param fg Color over bg
 * @param bg Background color
 */
export const normalBlend = (fg: RGBA, bg: RGBA): RGBA => {
	const a = fg[3] / 255,
		na = 1 - a,
		ab = (bg[3] / 255) * na;
	return new Uint8ClampedArray([
		fg[0] * a + bg[0] * ab,
		fg[1] * a + bg[1] * ab,
		fg[2] * a + bg[2] * ab,
		fg[3] + bg[3] * na,
	]);
};
