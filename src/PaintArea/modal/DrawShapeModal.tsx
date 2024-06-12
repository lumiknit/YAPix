import { Component, For, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";

import { DrawShape, PaintState } from "@/paint";

import { DRAW_SHAPE_ICON } from "../draw-shape";

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
					<button onClick={() => props.z.setDrawShape(shapeName)}>
						<Dynamic component={DRAW_SHAPE_ICON[shapeName]} />
						{shapeName}
					</button>
				)}
			</For>
		</>
	);
};

export default DrawShapeModal;
