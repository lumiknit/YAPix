import { Component } from "solid-js";
import { State } from "./state";
import { ellipsePolygon, polygonToSVG } from "./polygon";

type Props = {
	z: State;
};

const Cursor: Component<Props> = props => {
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
		const bs = props.z.brush().shape;
		return bs.maxX - bs.minX;
	};
	const brushH = () => {
		const bs = props.z.brush().shape;
		return bs.maxY - bs.minY;
	};
	const z = () => Math.floor(props.z.display().zoom);
	const iz = () => 1 / Math.floor(props.z.display().zoom);

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
					width={2 + z() * brushW()}
					height={2 + z() * brushH()}
					viewBox={`${-iz() + props.z.brush().shape.minX} ${-iz() + props.z.brush().shape.minY} ${brushW() + 2 * iz()} ${brushH() + 2 * iz()}`}
					style={{
						transform: `translate(-1px, -1px)`,
						stroke: "green",
						"stroke-width": `${2 * iz()}px`,
						fill: "none",
					}}>
					<polygon points={polygonToSVG(props.z.brush().shape)} />
				</svg>
			</div>
		</>
	);
};

export default Cursor;
