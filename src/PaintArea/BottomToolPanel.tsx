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
	TbPencilMinus,
	TbPencilPlus,
	TbSelectAll,
	TbSettings,
} from "solid-icons/tb";
import { ToolColorPreview } from "./ToolColorPreview";
import toast from "solid-toast";

type Props = {
	z: PaintState;
};

const BottomToolPanel: Component<Props> = props => {
	return (
		<div class="p-tool-panel">
			<div class="p-tool-row p-tr-dev">
				<ToolButton
					onClick={() =>
						props.z.setBrushShape(props.z.brush().size.w - 1, true)
					}>
					<TbPencilMinus />
					Decrease Brush
				</ToolButton>
				<ToolButton
					onClick={() =>
						props.z.setBrushShape(props.z.brush().size.w + 1, true)
					}>
					<TbPencilPlus />
					Increase Brush
				</ToolButton>
			</div>
			<div class="p-tool-row p-tr-file">
				<ToolButton onClick={
					() => {
						const ctx = props.z.exportImage(4);
						const a = document.createElement("a");
						a.href = ctx.canvas.toDataURL();
						a.download = "image.png";
						a.click();
					}
				}>
					Export
				</ToolButton>
			</div>
			<div class="p-tool-row p-tr-util">
				<ToolColorPreview z={props.z} />
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
				<ToolButton>
					<TbSettings />
				</ToolButton>
			</div>
			<div class="p-tool-row p-tr-draw">
				<ToolButton> C </ToolButton>
				<ToolButton>
					<TbColorPicker />
				</ToolButton>
				<ToolButton onClick={() => {
					props.z.useTool("eraser");
					toast.success("Eraser selected");
				}}>
					<TbEraser />
				</ToolButton>
				<ToolButton onClick={() => {
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
