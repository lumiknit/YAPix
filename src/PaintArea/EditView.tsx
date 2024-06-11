import { Component } from "solid-js";

import { Canvas, PaintState } from "../paint";

import ToolPanel from "./BottomToolPanel";

import "./styles.scss";
import { PaintConfig } from "../paint/config";
import Modals, { createModalSwitches } from "./modal/Modals";

type Props = {};

const EditView: Component<Props> = () => {
	const config: PaintConfig = {
		brushStabilization: 10,
	};
	let state = new PaintState(config, 128, 128);
	let modalSwitches = createModalSwitches();
	return (
		<div class="p-edit-view">
			<div class="p-paint-area">
				<Canvas z={state} />
			</div>
			<ToolPanel z={state} sw={modalSwitches} />
			<Modals switches={modalSwitches} z={state} />
		</div>
	);
};

export default EditView;
