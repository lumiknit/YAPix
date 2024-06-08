import { Component, createSignal } from "solid-js";
import { HSV, HSVWheel } from "solid-tiny-color";

type Props = {
	color: HSV;
	onColor: (color: HSV) => void;
};

const ModalColorPicker: Component<Props> = props => {
	const [c, setC] = createSignal(props.color);
	const onColor = (color: HSV) => {
		setC(color);
		props.onColor(color);
	};
	return (
		<div class="pa-m-color-picker">
			<HSVWheel
				class="wheel"
				hsv={c()}
				onHSVChange={onColor}
				strokeWidth={0.2}
			/>
		</div>
	);
};

export default ModalColorPicker;
