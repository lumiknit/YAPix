import { Component, createSignal } from "solid-js";
import {
	HSV,
	HSVSliderH,
	HSVSliderS,
	HSVSliderV,
	HSVWheel,
	RGBSliderB,
	RGBSliderG,
	RGBSliderR,
	hsvToRGB,
	hsvToStyle,
	rgbToStyle,
} from "solid-tiny-color";
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

	const hexRGB = () => {
		const rgb = hsvToRGB(c());
		return (
			"#" + rgb.map(v => Math.floor(v).toString(16).padStart(2, "0")).join("")
		);
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
			<hr />
			<div class="pa-color-sliders">
				<div> RGB </div>
				<div class="pa-color-slider-line">
					<span>R:</span>
					<RGBSliderR class="pa-color-slider" hsv={c()} onHSVChange={onColor} />
					<input type="text" value={Math.floor(hsvToRGB(c())[0])} readonly />
				</div>
				<div class="pa-color-slider-line">
					<span>G:</span>
					<RGBSliderG class="pa-color-slider" hsv={c()} onHSVChange={onColor} />
					<input type="text" value={Math.floor(hsvToRGB(c())[1])} readonly />
				</div>
				<div class="pa-color-slider-line">
					<span>B:</span>
					<RGBSliderB class="pa-color-slider" hsv={c()} onHSVChange={onColor} />
					<input type="text" value={Math.floor(hsvToRGB(c())[2])} readonly />
				</div>
			</div>
			<hr />
			<div class="pa-color-sliders">
				<div> HSV </div>
				<div class="pa-color-slider-line">
					<span>H:</span>
					<HSVSliderH class="pa-color-slider" hsv={c()} onHSVChange={onColor} />
					<input type="text" value={Math.floor(c()[0])} readonly />
				</div>
				<div class="pa-color-slider-line">
					<span>S:</span>
					<HSVSliderS class="pa-color-slider" hsv={c()} onHSVChange={onColor} />
					<input type="text" value={Math.floor(c()[1] * 100)} readonly />
				</div>
				<div class="pa-color-slider-line">
					<span>V:</span>
					<HSVSliderV class="pa-color-slider" hsv={c()} onHSVChange={onColor} />
					<input type="text" value={Math.floor(c()[2] * 100)} readonly />
				</div>
			</div>
			<hr />
			<div class="pa-color-value">
				<div class="pa-color-slider-line">
					<span> Hex RGB </span>
					<input type="text" value={hexRGB()} readonly />
				</div>
			</div>
		</>
	);
};

export default PaletteModal;
