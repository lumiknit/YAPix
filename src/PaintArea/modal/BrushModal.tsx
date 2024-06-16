import { Component, createSignal } from "solid-js";

import {
	PaintState,
	getBrush,
	setBrushShape,
	setBrushShapeForCurrentTool,
} from "@/paint";
import CheckBox from "@/components/CheckBox";

type Props = {
	z: PaintState;
};

const BrushModal: Component<Props> = props => {
	const brush = () => getBrush(props.z);

	const [size, setSize] = createSignal(brush().size.w);
	const [round, setRound] = createSignal(brush().round);

	const updateBrush = () => {
		setBrushShapeForCurrentTool(props.z, size(), round());
	};

	const toggleRound = () => {
		setRound(v => !v);
		updateBrush();
	};

	return (
		<>
			<div class="pa-modal-title">Brush</div>

			<div class="pam-item">
				<span class="label"> Brush Size </span>
				<input
					type="number"
					value={brush().size.w}
					onInput={e => {
						setSize(parseInt((e.target as HTMLInputElement).value));
						updateBrush();
					}}
				/>
			</div>

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

			<hr />

			<label class="pam-item" onClick={toggleRound}>
				<span class="label"> Round Brush </span>
				<CheckBox checked={round()} />
			</label>
		</>
	);
};

export default BrushModal;
