import { Component } from "solid-js";

import { PaintState } from "../paint";

import PaintArea from "./PaintArea";
import ToolPanel from "./BottomToolPanel";

import "./styles.scss";
import { PaintConfig } from "../paint/config";

type Props = {};

const EditView: Component<Props> = () => {
	const config: PaintConfig = {
		brushStabilization: 10,
	};
	let state = new PaintState(config, 128, 128);
	return (
		<div class="p-edit-view">
			<PaintArea z={state} />
			<ToolPanel z={state} />
		</div>
	);
};

export default EditView;
