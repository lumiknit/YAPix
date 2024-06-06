export const drawCircle_bresenham = (
	ctx: CanvasRenderingContext2D,
	x0: number,
	y0: number,
	l: number,
) => {
	const r = (l - 1) / 2;
	const o = ((l + 1) % 2) / 2;
	var x = r;
	var y = o;
	var radiusError = 1 - x + o;

	const cx = x0 + r;
	const cy = y0 + r;

	console.log("-----", l);
	while (x >= y) {
		console.log(x, y, `(${cx + x}, ${cy + y})`);

		ctx.fillRect(cx + x, cy + y, 1, 1);
		ctx.fillRect(cx + y, cy + x, 1, 1);

		ctx.fillRect(cx - x, cy + y, 1, 1);
		ctx.fillRect(cx - y, cy + x, 1, 1);

		ctx.fillRect(cx + x, cy - y, 1, 1);
		ctx.fillRect(cx + y, cy - x, 1, 1);

		ctx.fillRect(cx - x, cy - y, 1, 1);
		ctx.fillRect(cx - y, cy - x, 1, 1);

		y++;

		if (radiusError < 0) {
			radiusError += 2 * y + 1;
		} else {
			x--;
			radiusError += 2 * (y - x + 1);
		}
	}
};
