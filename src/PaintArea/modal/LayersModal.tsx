import { Component, For } from "solid-js";

import { PaintState } from "@/paint";

type Props = {
	z: PaintState;
};

const LayersModal: Component<Props> = props => {
	return (
		<>
			<div class="pa-modal-title">Layers</div>

			<For each={props.z.layers}>
				{(l, idx) => (
					<div class="pa-layer">
						{l.name + (props.z.focusedLayer === idx() ? " (focused)" : "")}
					</div>
				)}
			</For>
		</>
	);
};

export default LayersModal;
