import { Component } from "solid-js";
import { rgbaForStyle } from "../common/color";
import { PaintState } from "../paint";

type Props = {
	z: PaintState;
};

export const ToolColorPreview: Component<Props> = props => {
	const handleClick = () => {
		props.z.useColorHSV([Math.random() * 360, 1, 1]);
	};
	return (
		<div
			class="p-tool-color-preview"
			onClick={handleClick}
			style={{
				background: rgbaForStyle(props.z.palette().current),
			}}></div>
	);
};
