import { Component } from "solid-js";
import { modal } from "@lumiknit/solid-fekit";

import {
	rgba,
	rgbaForStyle,
	rgbaToTinyColor,
	tinyColorToRGBA,
} from "../common/color";
import { PaintState } from "../paint";
import ModalColorPicker from "./ModalColorPicker";
import { HSV, hsvToRGB, rgbToHSV } from "solid-tiny-color";

type Props = {
	z: PaintState;
};

export const ToolColorPreview: Component<Props> = props => {
	const handleClick = () => {
		const [rgb, a] = rgbaToTinyColor(props.z.palette().current);
		const hsv = rgbToHSV(rgb);
		modal.openModal(ModalColorPicker, {
			color: hsv,
			onColor: (color: HSV) => {
				props.z.useColorHSV(color);
			},
		});
		console.log("A");
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
