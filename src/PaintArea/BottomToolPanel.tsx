import { Component, For } from "solid-js";
import { Dynamic } from "solid-js/web";

import { rgbaForStyle } from "@/common";

import {
	TbArrowBackUp,
	TbArrowForwardUp,
	TbArtboard,
	TbBoxMultiple,
	TbBrush,
	TbClick,
	TbColorPicker,
	TbEraser,
	TbSelectAll,
	TbSettings,
} from "solid-icons/tb";
import {
	PaintState,
	ToolType,
	changeCurrentTool,
	handleDrawStart,
	handleDrawEnd,
	redo,
	undo,
	checkerBoardStyle,
} from "../paint";
import ToolButton from "./ToolButton";
import { DRAW_SHAPE_ICON, TOOL_ICON } from "./draw-shape-tool";
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

	const toolTypes = Object.keys(TOOL_ICON) as ToolType[];

	return (
		<div class="p-tool-panel">
			<div class="p-tool-row p-tr-util">
				<ToolButton onClick={openModalHandler("view")}>
					<TbArtboard />
				</ToolButton>
				<ToolButton onClick={openModalHandler("layers")}>
					<TbBoxMultiple />
				</ToolButton>
				<ToolButton onClick={openModalHandler("settings")}>
					<TbSettings />
				</ToolButton>
			</div>
			<div class="p-tool-row p-tr-util">
				<div
					class="p-tool-color-preview"
					onClick={openModalHandler("palette")}
					style={{
						"border-color": props.z.palette().hsv[2] > 0.5 ? "black" : "white",
						...checkerBoardStyle(props.z),
					}}>
					<div
						style={{
							background: rgbaForStyle(props.z.palette().current),
						}}
					/>
				</div>
				<ToolButton onClick={openModalHandler("drawShape")}>
					<Dynamic component={DRAW_SHAPE_ICON[props.z.drawShape()]} />
				</ToolButton>
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
			</div>
			<div class="p-tool-row p-tr-draw">
				<For each={toolTypes}>
					{type => (
						<ToolButton
							class={props.z.toolType() === type ? "active" : ""}
							onClick={() => handleToolChange(type)}>
							<Dynamic component={TOOL_ICON[type]} />
						</ToolButton>
					)}
				</For>
			</div>
			<div
				class="p-tool-row p-tr-dot"
				onPointerDown={e => {
					// Capture
					e.preventDefault();
					e.currentTarget.setPointerCapture(e.pointerId);
					handleDrawStart(props.z);
				}}
				onPointerUp={e => {
					e.currentTarget.releasePointerCapture(e.pointerId);
					handleDrawEnd(props.z);
				}}>
				<button class="p-tool-btn p-dot-btn">
					<TbClick /> DOT
				</button>
			</div>
		</div>
	);
};

export default BottomToolPanel;
