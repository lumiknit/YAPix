import { Component, For, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";

import { DrawShape, PaintState, rotateScaleDisplayByCenter } from "@/paint";

import { DRAW_SHAPE_ICON } from "../draw-shape";
import { rotateScale2D } from "@/common";

type Props = {
	z: PaintState;
};

const ViewModal: Component<Props> = props => {
	const shapes = Object.keys(DRAW_SHAPE_ICON) as DrawShape[];

	return (
		<>
			<div class="pa-modal-title">View</div>
			Zoom
			<input
				type="range"
				min="0.1"
				max="100"
				step="0.1"
				value={props.z.zoom()}
				onInput={e => {
					let z = +e.currentTarget.value;
					// Snap
					if (Math.abs(z - Math.round(z)) < 0.25) {
						z = Math.round(z);
					}
					rotateScaleDisplayByCenter(props.z, 0, z / props.z.zoom());
				}}
			/>
			{props.z.zoom()}
			<br />
			Rotate
			<input
				type="range"
				min={-Math.PI}
				max={Math.PI}
				step="0.01"
				value={props.z.angle().rad}
				onInput={e => {
					let angle = +e.currentTarget.value * (180 / Math.PI);
					// Snap by 15 degree
					if (Math.abs(angle - Math.round(angle / 15) * 15) < 3) {
						angle = Math.round(angle / 15) * 15;
					}
					rotateScaleDisplayByCenter(
						props.z,
						angle * (Math.PI / 180) - props.z.angle().rad,
						1,
					);
				}}
			/>
			{Math.round(props.z.angle().rad * (180 / Math.PI))}
		</>
	);
};

export default ViewModal;
