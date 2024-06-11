import { Component, createSignal } from "solid-js";
import { PaintState } from "../../paint";

type Props = {
	z: PaintState;
};

const BrushModal: Component<Props> = props => {
	const brush = () => props.z.brush();

	const [size, setSize] = createSignal(brush().size.w);
	const [round, setRound] = createSignal(brush().round);

	const updateBrush = () => {
		props.z.setBrushShape(size(), round());
	};

	return (
		<>
			<div class="pa-modal-title">Brush</div>

			<div> Brush Size</div>
			<input
				type="range"
				min="1"
				max="20"
				value={size()}
				onInput={e => {
					setSize(parseInt((e.target as HTMLInputElement).value));
					updateBrush();
				}}
			/>
			<input
				type="number"
				value={brush().size.w}
				onInput={e => {
					setSize(parseInt((e.target as HTMLInputElement).value));
					updateBrush();
				}}
			/>

			<label>
				<input
					type="checkbox"
					checked={round()}
					onChange={e => {
						setRound((e.target as HTMLInputElement).checked);
						updateBrush();
					}}
				/>
				Round Brush
			</label>
		</>
	);
};

export default BrushModal;
