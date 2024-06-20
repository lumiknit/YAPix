import { Component, Switch, Match, JSX, splitProps, onMount } from "solid-js";

import { TbSquare, TbSquareCheckFilled } from "solid-icons/tb";

import "./CheckBox.scss";

type Props = JSX.IntrinsicElements["div"] & {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	class?: string;
};

const CheckBox: Component<Props> = props_ => {
	const [props, divProps] = splitProps(props_, [
		"checked",
		"onChange",
		"class",
	]);

	let ref: HTMLDivElement;

	onMount(() => {
		ref.addEventListener("click", () => {
			props.onChange?.(!props.checked);
		});
	});

	const svgStyle = {
		width: "100%",
		height: "100%",
	};

	return (
		<div
			{...divProps}
			ref={ref!}
			class={`-d-ckbox ${props.class || ""}`}
			tabIndex={-1}>
			<Switch>
				<Match when={props.checked}>
					<TbSquareCheckFilled />
				</Match>
				<Match when={!props.checked}>
					<TbSquare />
				</Match>
			</Switch>
		</div>
	);
};

export default CheckBox;
