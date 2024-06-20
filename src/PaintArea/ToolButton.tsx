import {
	Component,
	mergeProps,
	onCleanup,
	onMount,
	splitProps,
} from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

type Props = {
	onActive?: () => void;
	onDeactive?: () => void;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

const ToolButton: Component<Props> = _props => {
	const props = mergeProps({ class: "" }, _props);
	const [locals, divProps] = splitProps(props, ["class"]);

	let ref: HTMLButtonElement;

	const handlers = {
		pointerdown: (e: PointerEvent) => {
			props.onActive?.();
			e.preventDefault();
			ref.setPointerCapture(e.pointerId);
		},
		pointerup: (e: PointerEvent) => {
			props.onDeactive?.();
			ref.releasePointerCapture(e.pointerId);
		},
		pointerleave: (e: PointerEvent) => {
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
