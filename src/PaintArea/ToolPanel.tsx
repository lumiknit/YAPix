import { Component } from "solid-js";
import { PaintState } from "../paint";
import ToolButton from "./ToolButton";

type Props = {
	z: PaintState;
};

const ToolPanel: Component<Props> = props => {
	return (
		<div class="p-tool-panel">
			<div class="p-tool-row p-tr-util">
				<ToolButton> Select </ToolButton>
				<ToolButton> Undo </ToolButton>
				<ToolButton> Redo </ToolButton>
				<ToolButton> Settings </ToolButton>
			</div>
			<div class="p-tool-row p-tr-draw">
				<ToolButton> Color </ToolButton>
				<ToolButton> Spoid </ToolButton>
				<ToolButton> Eraser </ToolButton>
				<ToolButton> Pen </ToolButton>
				<ToolButton> Paint Bucket </ToolButton>
				<ToolButton> Shape </ToolButton>
			</div>
			<div class="p-tool-row p-tr-dot">
				<button class="p-tool-btn"> DOT! </button>
			</div>
		</div>
	);
};

export default ToolPanel;
