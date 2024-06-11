import { Component } from "solid-js";
import { PaintState } from "../paint";
import ToolButton from "./ToolButton";
import {
	TbArrowBackUp,
	TbArrowBigDown,
	TbArrowForwardUp,
	TbBoxMultiple,
	TbBrush,
	TbBucket,
	TbCircle,
	TbColorPicker,
	TbEraser,
	TbSelectAll,
	TbSettings,
} from "solid-icons/tb";
import toast from "solid-toast";
import { ModalSwitches } from "./modal/Modals";
import { rgbaForStyle } from "../common/color";

type Props = {
	z: PaintState;
	sw: ModalSwitches;
};

const BottomToolPanel: Component<Props> = props => {
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
				<ToolButton onClick={() => props.sw.brush(true)}>
					<TbBrush />
				</ToolButton>
				<ToolButton>
					<TbSelectAll />
				</ToolButton>
				<ToolButton onClick={() => props.z.undo()}>
					<TbArrowBackUp />
				</ToolButton>
				<ToolButton onClick={() => props.z.redo()}>
					<TbArrowForwardUp />
				</ToolButton>
				<ToolButton>
					<TbBoxMultiple />
				</ToolButton>
				<ToolButton onClick={() => props.sw.settings(true)}>
					<TbSettings />
				</ToolButton>
			</div>
			<div class="p-tool-row p-tr-draw">
				<ToolButton> C </ToolButton>
				<ToolButton>
					<TbColorPicker />
				</ToolButton>
				<ToolButton
					onClick={() => {
						props.z.useTool("eraser");
						toast.success("Eraser selected");
					}}>
					<TbEraser />
				</ToolButton>
				<ToolButton
					onClick={() => {
						props.z.useTool("brush");
						toast.success("Brush selected");
					}}>
					<TbBrush />
				</ToolButton>
				<ToolButton>
					<TbBucket />
				</ToolButton>
				<ToolButton>
					<TbCircle />
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
