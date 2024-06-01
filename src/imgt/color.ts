export type RGBA = Uint8ClampedArray; // r, g, b, a: 0-255
export type HSLA = [number, number, number, number]; // h: 0-360, s: 0-100, l: 0-100, a: 0-1

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
 * Convert HSLA to style color string
 */
export const hslaForStyle = (hsla: HSLA): string =>
	`hsla(${hsla[0]}, ${hsla[1]}%, ${hsla[2]}%, ${hsla[3]})`;

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

/**
 * Convert RGBA to HSLA.
 * @param fg Color over bg
 * @param bg Background color
 */
export const rgbaToHSLA = (rgba: RGBA): HSLA => {
	const r = rgba[0] / 255,
		g = rgba[1] / 255,
		b = rgba[2] / 255,
		l = Math.max(r, g, b),
		s = l - Math.min(r, g, b),
		v = 2 * l - s,
		h = s
			? l === r
				? (g - b) / s
				: l === g
					? 2 + (b - r) / s
					: 4 + (r - g) / s
			: 0;
	return [
		60 * (h < 0 ? h + 6 : h),
		100 * (s ? (l <= 0.5 ? s / v : s / (2 - v)) : 0),
		(100 * v) / 2,
		rgba[3] / 255,
	];
};

/**
 * Convert HSLA to RGBA.
 * @param hsla HSLA
 */
export const hslaToRGBA = (hsla: HSLA): RGBA => {
	const l = hsla[2] / 100,
		k = (n: number) => (n + hsla[0] / 30) % 12,
		a = (hsla[1] / 100) * Math.min(l, 1 - l),
		f = (n: number) =>
			l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return rgba(255 * f(0), 255 * f(8), 255 * f(4), hsla[3] * 255);
};
