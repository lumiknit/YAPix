import { Component } from "solid-js";

import { PaintState } from "@/paint";
import { ctxToBlob } from "@/common";

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
					const blob = ctxToBlob(ctx);
					blob.then(b => {
						const url = URL.createObjectURL(b);
						const a = document.createElement("a");
						a.href = url;
						a.download = "image.png";
						a.click();
						URL.revokeObjectURL(url);
					});
				}}>
				Export
			</button>

			<hr />

			<div> Hello </div>
		</>
	);
};

export default SettingsModal;
