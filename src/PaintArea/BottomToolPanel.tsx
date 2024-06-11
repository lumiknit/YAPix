import { Component } from "solid-js";
import { DrawShape, PaintState, ToolType } from "../paint";
import ToolButton from "./ToolButton";
import {
	TbArrowBackUp,
	TbArrowBigDown,
	TbArrowForwardUp,
	TbArrowsHorizontal,
	TbBoxMultiple,
	TbBrush,
	TbBucket,
	TbCircle,
	TbCircleFilled,
	TbColorPicker,
	TbEraser,
	TbSelectAll,
	TbSettings,
	TbSquare,
	TbWriting,
} from "solid-icons/tb";
import { IoSquare } from "solid-icons/io";
import toast from "solid-toast";
import { ModalSwitches } from "./modal/Modals";
import { rgbaForStyle } from "../common/color";
import { Dynamic } from "solid-js/web";

type Props = {
	z: PaintState;
	sw: ModalSwitches;
};

const BottomToolPanel: Component<Props> = props => {
	const handleToolChange = (tool: ToolType) => {
		const currentTool = props.z.tool();
		if (tool === currentTool) {
			// Open the brush modal
			props.sw.brush(true);
		} else {
			// Change the tool
			props.z.useTool(tool);
		}
	};

	const drawShapeIcon: { [key in DrawShape]: Component<any> } = {
		free: TbWriting,
		rect: TbSquare,
		fillRect: IoSquare,
		ellipse: TbCircle,
		fillEllipse: TbCircleFilled,
		line: TbArrowsHorizontal,
		fill: TbBucket,
	};

	return (
		<div class="p-tool-panel">
			<div class="p-tool-row p-tr-util">
				<div
					class="p-tool-color-preview"
					onClick={() => props.sw.palette(true)}
					style={{
						background: rgbaForStyle(props.z.palette().current),
						"border-color": props.z.palette().hsv[2] > 0.5 ? "black" : "white",
					}}
				/>
				<ToolButton>
					<TbSelectAll />
				</ToolButton>
				<ToolButton
					onClick={() => props.z.undo()}
					disabled={props.z.history.historySize()[0] <= 0}>
					<TbArrowBackUp />
				</ToolButton>
				<ToolButton
					onClick={() => props.z.redo()}
					disabled={props.z.history.historySize()[1] <= 0}>
					<TbArrowForwardUp />
				</ToolButton>
				<ToolButton onClick={() => props.sw.layers(true)}>
					<TbBoxMultiple />
				</ToolButton>
				<ToolButton onClick={() => props.sw.settings(true)}>
					<TbSettings />
				</ToolButton>
			</div>
			<div class="p-tool-row p-tr-draw">
				<ToolButton>
					<TbColorPicker />
				</ToolButton>
				<ToolButton
					class={props.z.tool() === "eraser" ? "active" : ""}
					onClick={() => handleToolChange("eraser")}>
					<TbEraser />
				</ToolButton>
				<ToolButton
					class={props.z.tool() === "brush" ? "active" : ""}
					onClick={() => handleToolChange("brush")}>
					<TbBrush />
				</ToolButton>
				<ToolButton>
					<Dynamic component={drawShapeIcon[props.z.drawShape()]} />
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
