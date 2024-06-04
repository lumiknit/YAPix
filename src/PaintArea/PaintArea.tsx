import { Component } from "solid-js";
import { Canvas, PaintState } from "../paint";

type Props = {
	z: PaintState;
};

const PaintArea: Component<Props> = props => {
	return (
		<div class="p-paint-area">
			<Canvas z={props.z} />
		</div>
	);
};

export default PaintArea;
