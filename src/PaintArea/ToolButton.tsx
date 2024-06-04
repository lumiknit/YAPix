import { Component } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import toast from "solid-toast";

type Props = {
	children: JSX.Element | JSX.Element[];
};

const ToolButton: Component<Props> = props => {
	return (
		<button class="p-tool-btn" onClick={() => toast("COOL")}>
			{props.children}
		</button>
	);
};

export default ToolButton;
