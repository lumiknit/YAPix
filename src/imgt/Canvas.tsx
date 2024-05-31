import { Component, onMount } from "solid-js";
import { State } from "./state";

type Props = {
	z: State;
};

const Canvas: Component<Props> = props => {
	onMount(() => {});

	const handleMove = (e: MouseEvent) => {
		if (e.buttons !== 1) return;

		const ctx = props.z.mainLayerRef!.getContext("2d");
		if (!ctx) throw new Error("Failed to get 2d context");

		// Write a pixel
		const x = e.offsetX;
		const y = e.offsetY;
		const color = props.z.color1;

		ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
		ctx.fillRect(x, y, 1, 1);

		console.log(`Clicked at (${x}, ${y})`);
	};

	return (
		<div class="canvas-root" onMouseMove={handleMove}>
			<canvas
				ref={props.z.mainLayerRef}
				width={props.z.width}
				height={props.z.height}
			/>
			<canvas
				ref={props.z.belowLayerRef}
				width={props.z.width}
				height={props.z.height}
			/>
			<canvas
				ref={props.z.aboveLayerRef}
				width={props.z.width}
				height={props.z.height}
			/>
		</div>
	);
};

export default Canvas;
