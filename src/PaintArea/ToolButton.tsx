import { Component, onCleanup, onMount, splitProps } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

type Props = {
	onActive?: () => void;
	onDeactive?: () => void;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

const ToolButton: Component<Props> = props => {
	const [locals, divProps] = splitProps(props, ["class"]);

	let ref: HTMLButtonElement;

	const handlers = {
		pointerdown: (e: PointerEvent) => {
			console.log("down");
			props.onActive?.();
			e.preventDefault();
			ref.setPointerCapture(e.pointerId);
		},
		pointerup: (e: PointerEvent) => {
			console.log("up");
			props.onDeactive?.();
			ref.releasePointerCapture(e.pointerId);
		},
		pointerleave: (e: PointerEvent) => {
			console.log("leave");
			props.onDeactive?.();
			ref.releasePointerCapture(e.pointerId);
		},
	};

	onMount(() => {
		for (const [key, handler] of Object.entries(handlers)) {
			ref.addEventListener(key, handler as any);
		}
	});

	onCleanup(() => {
		for (const [key, handler] of Object.entries(handlers)) {
			ref.removeEventListener(key, handler as any);
		}
	});

	return (
		<button class={`p-tool-btn ${locals.class}`} {...divProps} ref={ref!} />
	);
};

export default ToolButton;
