import { Component, createMemo } from "solid-js";

import { boundaryToRect } from "@/common";

import { PaintState, getBrush, getBrushCursorPos } from ".";
import { polygonToSVG } from "./polygon";

type Props = {
	z: PaintState;
};

const Cursor: Component<Props> = props => {
	const z = () => props.z.zoom();
	const iz = createMemo(() => 1 / props.z.zoom());

	const strokeWidth = createMemo(() => {
		const zoom = props.z.zoom();
		return zoom > 16 ? 4 : zoom > 8 ? 2 : 1;
	});

	const brushCursorSVGTransform = createMemo(() => {
		const sw = strokeWidth() / 2;
		return `translate(-${sw}px, -${sw}px)`;
	});

	const realCursorTransform = createMemo(() => {
		const z = props.z,
			d = z.scroll(),
			zoom = z.zoom(),
			cur = z.cursor(),
			x = Math.floor(d.x + zoom * cur.real.x),
			y = Math.floor(d.y + zoom * cur.real.y);
		return `translate(${x}px, ${y}px)`;
	});

	const brushCursorTransform = createMemo(() => {
		const pos = getBrushCursorPos(props.z);
		const d = props.z.scroll();
		const zoom = props.z.zoom();
		return `translate(${Math.floor(d.x + zoom * pos.x)}px, ${Math.floor(d.y + zoom * pos.y)}px)`;
	});
	const brushW = createMemo(() => {
		const bd = getBrush(props.z).shape.bd;
		return bd.r - bd.l;
	});
	const brushH = createMemo(() => {
		const bd = getBrush(props.z).shape.bd;
		return bd.b - bd.t;
	});

	const viewBox = createMemo(() => {
		const r = boundaryToRect(getBrush(props.z).shape.bd);
		const sw = (strokeWidth() * iz()) / 2;
		return `${r.x - sw} ${r.y - sw} ${r.w + 2 * sw} ${r.h + 2 * sw}`;
	});

	return (
		<>
			<div
				class="cv-real-cursor"
				style={{
					transform: realCursorTransform() + " translate(-50%, -50%)",
					"z-index": 2,
				}}
			/>
			<div
				class="cv-cursor"
				style={{
					transform: brushCursorTransform(),
					"z-index": 2,
					"mix-blend-mode": "difference",
				}}>
				<svg
					width={2 * strokeWidth() + z() * brushW()}
					height={2 * strokeWidth() + z() * brushH()}
					viewBox={viewBox()}
					style={{
						transform: brushCursorSVGTransform(),
						stroke: "white",
						"stroke-width": `${strokeWidth() * iz()}px`,
					}}>
					<polygon points={polygonToSVG(getBrush(props.z).shape)} />
				</svg>
			</div>
		</>
	);
};

export default Cursor;
