import { Component } from "solid-js";

import { PaintState, fitCanvasToRoot, mergeLayersWithNewCtx } from "@/paint";
import { ctxToBlob } from "@/common";

type Props = {
	z: PaintState;
};

const SettingsModal: Component<Props> = props => {
	return (
		<>
			<div class="pa-modal-title">Settings / Files</div>

			<div> About </div>

			<a class="pam-item" href="https://github.com/lumiknit/dubu-tl">
				https://github.com/lumiknit/dubu-tl
			</a>

			<div> Other </div>

			<div
				class="pam-item"
				onClick={() => {
					fitCanvasToRoot(props.z);
				}}>
				Reset Zoom
			</div>

			<div> Files </div>

			<div
				class="pam-item"
				onClick={() => {
					const ctx = mergeLayersWithNewCtx(props.z, 4);
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
			</div>

			<hr />

			<div> Hello </div>
		</>
	);
};

export default SettingsModal;
