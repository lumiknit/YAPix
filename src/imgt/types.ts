export type Pos = {
	x: number;
	y: number;
};

export const ORIGIN = { x: 0, y: 0 };

export type Size = {
	width: number;
	height: number;
};

export type Rect = Pos & Size;

export type Display = Pos & {
	zoom: number;
};
