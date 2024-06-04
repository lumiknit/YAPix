import { Component } from "solid-js";

import { PaintState } from "../paint";

import PaintArea from "./PaintArea";
import ToolPanel from "./ToolPanel";

import "./styles.scss";

type Props = {};

const EditView: Component<Props> = () => {
	let state = new PaintState(32, 32);
	return (
		<div class="p-edit-view">
			<PaintArea z={state} />
			<ToolPanel z={state} />
		</div>
	);
};

export default EditView;
