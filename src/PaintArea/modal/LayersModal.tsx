import { Component } from "solid-js";
import { PaintState } from "../../paint";

type Props = {
	z: PaintState;
};

const LayersModal: Component<Props> = props => {
	return (
		<>
			<div class="pa-modal-title">Layers</div>
		</>
	);
};

export default LayersModal;
