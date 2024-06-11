import { Component, createSignal } from "solid-js";
import { HSV, HSVWheel, hsvToRGB, hsvToStyle } from "solid-tiny-color";
import { PaintState } from "../../paint";
import { rgbaForStyle } from "../../common/color";

type Props = {
	z: PaintState;
};

const PaletteModal: Component<Props> = props => {
	const palette = () => props.z.palette();

	let updateTimeout: undefined | number;
	let newColor = palette().hsv;

	const [c, setC] = createSignal<HSV>(newColor);
	const onColor = (color: HSV) => {
		setC(color);
		newColor = color;
		// Delayed set
		if (updateTimeout === undefined) {
			updateTimeout = setTimeout(() => {
				props.z.useColorHSV(newColor);
				updateTimeout = undefined;
			}, 100);
		}
	};
	return (
		<>
			<div class="pa-modal-title">
				Palette
				<span
					class="p-tool-color-preview"
					style={{
						display: "inline-block",
						width: "1.5em",
						height: "1em",
						"vertical-align": "bottom",
						margin: "0 0.5em",
						background: hsvToStyle(c()),
						"border-color": c()[2] > 0.5 ? "black" : "white",
					}}
				/>
			</div>
			<div class="pa-color-picker">
				<HSVWheel
					class="wheel"
					hsv={c()}
					onHSVChange={onColor}
					strokeWidth={0.25}
					rotate
				/>
			</div>
		</>
	);
};

export default PaletteModal;
