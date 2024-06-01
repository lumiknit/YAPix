export type NumVec4 = Uint8ClampedArray;
export type RGBA = NumVec4;
export type HSLA = NumVec4;

export const rgba = (r: number, g: number, b: number, a: number): RGBA =>
	new Uint8ClampedArray([r, g, b, a]);

export const normalBlend = (fg: RGBA, bg: RGBA): RGBA => {
	const a = fg[3] / 255;
	const na = 1 - a;
	const ab = bg[3] / 255;
	return new Uint8ClampedArray([
		fg[0] * a + bg[0] * ab * na,
		fg[1] * a + bg[1] * ab * na,
		fg[2] * a + bg[2] * ab * na,
		fg[3] + bg[3] * na,
	]);
};

export const rgbaForStyle = (rgba: RGBA): string =>
	`rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3] / 255})`;
