import { Component, For } from "solid-js";
import { Dynamic } from "solid-js/web";

import { DrawShape, PaintState } from "@/paint";

import { DRAW_SHAPE_ICON } from "../draw-shape-tool";

type Props = {
	z: PaintState;
};

const DrawShapeModal: Component<Props> = props => {
	const shapes = Object.keys(DRAW_SHAPE_ICON) as DrawShape[];

	return (
		<>
			<div class="pa-modal-title">Draw Shape</div>
			<For each={shapes}>
				{shapeName => (
					<div
						class={`pam-item ${props.z.drawShape() === shapeName ? "selected" : ""}`}
						onClick={() => props.z.setDrawShape(shapeName)}>
						<span class="label">{shapeName}</span>
						<Dynamic component={DRAW_SHAPE_ICON[shapeName]} />
					</div>
				)}
			</For>
		</>
	);
};

export default DrawShapeModal;
