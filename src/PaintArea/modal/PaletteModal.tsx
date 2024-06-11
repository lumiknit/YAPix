import { Component, For, Index, createMemo, createSignal } from "solid-js";
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
	rgbToHSV,
} from "solid-tiny-color";
import { PaintState } from "../../paint";
import { RGBA, rgbaForStyle } from "../../common/color";

import "./PaletteModal.scss";

type Props = {
	z: PaintState;
};

const PaletteModal: Component<Props> = props => {
	const palette = () => props.z.palette();

	const reversedPaletteHistory = createMemo(() => {
		const palette = props.z.palette();
		const history = [...palette.history];
		history.reverse();
		return history;
	});

	let updateTimeout: undefined | number;
	let newColor = palette().hsv;

	const [c, setC] = createSignal<HSV>(newColor);
	const onColor = (color: HSV) => {
		setC(color);
		newColor = color;
		// Delayed set
		if (updateTimeout !== undefined) {
			clearTimeout(updateTimeout);
		}
		updateTimeout = setTimeout(() => {
			props.z.useColorHSV(newColor);
			updateTimeout = undefined;
		}, 500);
	};

	const hexRGB = () => {
		const rgb = hsvToRGB(c());
		return (
			"#" + rgb.map(v => Math.floor(v).toString(16).padStart(2, "0")).join("")
		);
	};

	const useColorFromHistory = (reversedIdx: number, color: RGBA) => {
		setC(rgbToHSV([color[0], color[1], color[2]]));
		props.z.useColorFromHistory(-1 - reversedIdx);
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
			<hr />
			<div> Last Used Colors </div>
			<div class="pa-palette">
				<Index each={reversedPaletteHistory()}>
					{(c, idx) => (
						<div
							class="pa-palette-color"
							style={{
								background: rgbaForStyle(c()),
							}}
							onClick={() => useColorFromHistory(idx, c())}
						/>
					)}
				</Index>
			</div>
		</>
	);
};

export default PaletteModal;
