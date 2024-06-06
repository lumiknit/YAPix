import { Component, splitProps } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

type Props = {} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

const ToolButton: Component<Props> = props => {
	const [locals, divProps] = splitProps(props, ["class"]);
	return <button class={`p-tool-btn ${locals.class}`} {...divProps} />;
};

export default ToolButton;
