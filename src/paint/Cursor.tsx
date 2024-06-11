import { Component, createEffect, createMemo } from "solid-js";
import { PaintState } from "./state";
import { polygonToSVG } from "./polygon";
import { boundaryToRect } from ".";

type Props = {
	z: PaintState;
};

const Cursor: Component<Props> = props => {
	const z = () => props.z.zoom();
	const iz = () => 1 / props.z.zoom();
	const strokeWidth = createMemo(() => {
		const zoom = props.z.zoom();
		return zoom > 16 ? 4 : zoom > 8 ? 2 : 1;
	});
	const brushCursorSVGTransform = createMemo(() => {
		const sw = strokeWidth() / 2;
		return `translate(-${sw}px, -${sw}px)`;
	});
	const rx = createMemo(() => {
		const d = props.z.scroll();
		const zoom = props.z.zoom();
		return Math.floor(d.x + zoom * props.z.cursor().real.x);
	});
	const ry = createMemo(() => {
		const d = props.z.scroll();
		const zoom = props.z.zoom();
		return Math.floor(d.y + zoom * props.z.cursor().real.y);
	});
	const brushCursorTransform = createMemo(() => {
		const pos = props.z.brushCursorPos();
		const d = props.z.scroll();
		const zoom = props.z.zoom();
		return `translate(${Math.floor(d.x + zoom * pos.x)}px, ${Math.floor(d.y + zoom * pos.y)}px)`;
	});
	const brushW = createMemo(() => {
		const bd = props.z.brush().shape.bd;
		return bd.r - bd.l;
	});
	const brushH = createMemo(() => {
		const bd = props.z.brush().shape.bd;
		return bd.b - bd.t;
	});

	const viewBox = createMemo(() => {
		const r = boundaryToRect(props.z.brush().shape.bd);
		const sw = (strokeWidth() * iz()) / 2;
		return `${r.x - sw} ${r.y - sw} ${r.w + 2 * sw} ${r.h + 2 * sw}`;
	});

	return (
		<>
			<div
				class="cv-real-cursor"
				style={{
					transform: `translate(${rx()}px, ${ry()}px) translate(-50%, -50%)`,
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
						fill: "none",
					}}>
					<polygon points={polygonToSVG(props.z.brush().shape)} />
				</svg>
			</div>
		</>
	);
};

export default Cursor;
