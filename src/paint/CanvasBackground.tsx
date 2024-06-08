import { Component } from "solid-js";
import { PaintState } from ".";
import { styleBgCheckerboard } from "solid-tiny-color";
import { normalBlend, rgba, rgbaForStyle } from "../common/color";
import { JSX } from "solid-js/h/jsx-runtime";

type Props = {
	z: PaintState;
};

const CanvasBackground: Component<Props> = props => {
	const sizeStyle = (): JSX.CSSProperties => {
		const d = props.z.display();
		return {
			width: `${props.z.size.w * d.zoom}px`,
			height: `${props.z.size.h * d.zoom}px`,
		};
	};

	const bgStyle = (): JSX.CSSProperties => {
		const cfgBg = props.z.config().bgCheckerboard;
		const bgColor = props.z.bgColor();
		if (bgColor[3] >= 255) {
			return { "background-color": rgbaForStyle(bgColor) };
		}
		const color1 = normalBlend(
			bgColor,
			rgba(cfgBg.color1[0], cfgBg.color1[1], cfgBg.color1[2], 255),
		);
		const color2 = normalBlend(
			bgColor,
			rgba(cfgBg.color2[0], cfgBg.color2[1], cfgBg.color2[2], 255),
		);
		return styleBgCheckerboard(
			rgbaForStyle(color1),
			rgbaForStyle(color2),
			cfgBg.size,
		);
	};

	return (
		<div
			style={{
				"z-index": 0.1,
				top: 0,
				left: 0,
				...bgStyle(),
				...sizeStyle(),
			}}
		/>
	);
};

export default CanvasBackground;
