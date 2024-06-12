import { Component } from "solid-js";
import { Dynamic } from "solid-js/web";

import { rgbaForStyle } from "@/common";

import {
	TbArrowBackUp,
	TbArrowBigDown,
	TbArrowForwardUp,
	TbBoxMultiple,
	TbBrush,
	TbColorPicker,
	TbEraser,
	TbSelectAll,
	TbSettings,
} from "solid-icons/tb";
import { PaintState, ToolType, changeCurrentTool, redo, undo } from "../paint";
import ToolButton from "./ToolButton";
import { DRAW_SHAPE_ICON } from "./draw-shape";
import { ModalSwitches, ModalTypes } from "./modal/Modals";

type Props = {
	z: PaintState;
	sw: ModalSwitches;
};

const BottomToolPanel: Component<Props> = props => {
	const handleToolChange = (tool: ToolType) => {
		const currentTool = props.z.toolType();
		if (tool === currentTool) {
			// Open the brush modal
			props.sw.brush(true);
		} else {
			// Change the tool
			changeCurrentTool(props.z, tool);
		}
	};

	const openModalHandler = (type: ModalTypes) => () => {
		props.sw[type](true);
	};

	return (
		<div class="p-tool-panel">
			<div class="p-tool-row p-tr-util">
				<div
					class="p-tool-color-preview"
					onClick={openModalHandler("palette")}
					style={{
						background: rgbaForStyle(props.z.palette().current),
						"border-color": props.z.palette().hsv[2] > 0.5 ? "black" : "white",
					}}
				/>
				<ToolButton>
					<TbSelectAll />
				</ToolButton>
				<ToolButton
					onClick={() => undo(props.z)}
					disabled={props.z.history.historySize()[0] <= 0}>
					<TbArrowBackUp />
				</ToolButton>
				<ToolButton
					onClick={() => redo(props.z)}
					disabled={props.z.history.historySize()[1] <= 0}>
					<TbArrowForwardUp />
				</ToolButton>
				<ToolButton onClick={openModalHandler("layers")}>
					<TbBoxMultiple />
				</ToolButton>
				<ToolButton onClick={openModalHandler("settings")}>
					<TbSettings />
				</ToolButton>
			</div>
			<div class="p-tool-row p-tr-draw">
				<ToolButton>
					<TbColorPicker />
				</ToolButton>
				<ToolButton
					class={props.z.toolType() === "eraser" ? "active" : ""}
					onClick={() => handleToolChange("eraser")}>
					<TbEraser />
				</ToolButton>
				<ToolButton
					class={props.z.toolType() === "brush" ? "active" : ""}
					onClick={() => handleToolChange("brush")}>
					<TbBrush />
				</ToolButton>
				<ToolButton onClick={openModalHandler("drawShape")}>
					<Dynamic component={DRAW_SHAPE_ICON[props.z.drawShape()]} />
				</ToolButton>
			</div>
			<div class="p-tool-row p-tr-dot">
				<button class="p-tool-btn p-dot-btn">
					<TbArrowBigDown /> DOT!
				</button>
			</div>
		</div>
	);
};

export default BottomToolPanel;
