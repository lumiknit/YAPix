import { Component, createSignal } from "solid-js";
import { PaintState } from "../../paint";

type Props = {
	z: PaintState;
};

const SettingsModal: Component<Props> = props => {
	return (
		<>
			<div class="pa-modal-title">Settings / Files</div>

			<div> Other </div>

			<button
				onClick={() => {
					props.z.fitCanvasToRoot();
				}}>
				Reset Zoom
			</button>

			<div> Files </div>

			<button
				onClick={() => {
					const ctx = props.z.exportImage(4);
					const a = document.createElement("a");
					a.href = ctx.canvas.toDataURL();
					a.download = "image.png";
					a.click();
				}}>
				Export
			</button>

			<hr />

			<div> Hello </div>
		</>
	);
};

export default SettingsModal;
