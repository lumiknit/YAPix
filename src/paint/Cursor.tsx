import { Component } from "solid-js";
import { PaintState } from "./state";
import { polygonToSVG } from "./polygon";
import { boundaryToRect } from ".";

type Props = {
	z: PaintState;
};

const Cursor: Component<Props> = props => {
	const z = () => Math.floor(props.z.display().zoom);
	const iz = () => 1 / Math.floor(props.z.display().zoom);
	const strokeWidth = () => {
		const d = props.z.display();
		return d.zoom > 4 ? 2 : 1;
	};
	const rx = () => {
		const d = props.z.display();
		return Math.floor(d.x + d.zoom * props.z.cursor().real.x);
	};
	const ry = () => {
		const d = props.z.display();
		return Math.floor(d.y + d.zoom * props.z.cursor().real.y);
	};
	const x = () => {
		const d = props.z.display();
		return Math.floor(d.x + d.zoom * props.z.brushCursorX());
	};
	const y = () => {
		const d = props.z.display();
		return Math.floor(d.y + d.zoom * props.z.brushCursorY());
	};
	const brushW = () => {
		const bd = props.z.brush().shape.bd;
		return bd.r - bd.l;
	};
	const brushH = () => {
		const bd = props.z.brush().shape.bd;
		return bd.b - bd.t;
	};

	const viewBox = () => {
		const r = boundaryToRect(props.z.brush().shape.bd);
		const sw = strokeWidth() * iz();
		return `${r.x - sw} ${r.y - sw} ${r.w + 2 * sw} ${r.h + 2 * sw}`;
	};

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
					transform: `translate(${x()}px, ${y()}px)`,
					"z-index": 2,
				}}>
				<svg
					width={2 * strokeWidth() + z() * brushW()}
					height={2 * strokeWidth() + z() * brushH()}
					viewBox={viewBox()}
					style={{
						transform: `translate(-1px, -1px)`,
						stroke: "green",
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
