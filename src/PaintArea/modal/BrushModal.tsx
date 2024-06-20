import { Component, For, Match, Show, Switch, createSignal } from "solid-js";

import {
	PaintState,
	getBrush,
	setBrushShape,
	setBrushShapeForCurrentTool,
	setBrushTextOptions,
	setSpoidLocal,
} from "@/paint";
import CheckBox from "@/components/CheckBox";

type Props = {
	z: PaintState;
};

const BrushShapeSizePart: Component<Props> = props => {
	const brush = () => getBrush(props.z);
	const [size, setSize] = createSignal(brush().size);
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
			<div class="pam-item">
				<span class="label"> Brush Size </span>
				<input
					type="number"
					value={brush().size}
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

const SpoidPart: Component<Props> = props => {
	const brush = () => getBrush(props.z);

	const toggleLocal = () => {
		setSpoidLocal(props.z, props.z.toolType(), !brush().spoidLocal);
	};

	return (
		<>
			<label class="pam-item" onClick={toggleLocal}>
				<span class="label"> Local </span>
				<CheckBox checked={brush().spoidLocal} />
			</label>
		</>
	);
};

const TextPart: Component<Props> = props => {
	const brush = () => getBrush(props.z);
	const fontSizes = [8, 10, 12];

	const handleSizeChange = (e: Event) => {
		const v = (e.target as HTMLSelectElement).value;
		setBrushTextOptions(props.z, props.z.toolType(), undefined, parseInt(v));
	};

	const handleTextChange = (e: Event) => {
		const v = (e.target as HTMLInputElement).value;
		setBrushTextOptions(props.z, props.z.toolType(), v);
	};

	return (
		<>
			<label class="pam-item">
				<span class="label"> Font Size </span>
				<select onChange={handleSizeChange}>
					<For each={fontSizes}>
						{sz => (
							<option value={sz} selected={brush().fontSize === sz}>
								{sz}
							</option>
						)}
					</For>
				</select>
			</label>

			<label class="pam-item">
				<span class="label"> Text </span>
				<input
					type="text"
					value={brush().text ?? ""}
					onChange={handleTextChange}
				/>
			</label>
		</>
	);
};

const BrushModal: Component<Props> = props => {
	const toolType = () => props.z.toolType();

	return (
		<>
			<div class="pa-modal-title">Brush ({toolType()})</div>

			<Switch>
				{/* Brush or Eraser */}
				<Match when={toolType() === "brush" || toolType() === "eraser"}>
					<BrushShapeSizePart {...props} />
				</Match>

				{/* Spoid */}
				<Match when={toolType() === "spoid"}>
					<SpoidPart {...props} />
				</Match>

				{/* Text */}
				<Match when={toolType() === "text"}>
					<TextPart {...props} />
				</Match>
			</Switch>
		</>
	);
};

export default BrushModal;
