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
				<ToolButton>
					<TbEraser />
				</ToolButton>
				<ToolButton>
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
