import { Component, onMount, onCleanup } from "solid-js";

import { State } from "./state";

import "./index.scss";
import Cursor from "./Cursor";

type Props = {
	z: State;
};

const Canvas: Component<Props> = props => {
	let rootRef: HTMLDivElement;

	// Set main loop
	let mainLoop: number = 0;
	onMount(() => {
		mainLoop = setInterval(() => props.z.step(), 16);
	});
	onCleanup(() => clearTimeout(mainLoop));

	const handlePointerMove = (e: PointerEvent) => {
		const boundRect = rootRef.getBoundingClientRect();
		const originalX = e.clientX - boundRect.left;
		const originalY = e.clientY - boundRect.top;

		let [x, y] = props.z.invertTransform(originalX, originalY);
		props.z.updateRealCursor(x, y);

		x = Math.floor(x);
		y = Math.floor(y);

		if (e.buttons !== 1) return;

		const ctx = props.z.focusedLayerRef!.getContext("2d");
		if (!ctx) throw new Error("Failed to get 2d context");

		// Write a pixel

		// Get the bound rect of the canvas

		const color = props.z.palette().current;

		ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
		ctx.fillRect(x, y, 1, 1);
	};

	return (
		<div ref={rootRef!} class="cv-root" onPointerMove={handlePointerMove}>
			<Cursor z={props.z} />
			<div
				class="cv-view"
				style={{
					transform: `translate(${props.z.display().x}px, ${props.z.display().y}px) scale(${props.z.display().zoom})`,
				}}>
				<canvas
					ref={props.z.focusedLayerRef}
					class="cv-pix"
					style={{ "z-index": 1, top: 0, left: 0 }}
					width={props.z.size.w}
					height={props.z.size.h}
				/>
				<canvas
					ref={props.z.belowLayerRef}
					class="cv-pix"
					style={{ "z-index": 0.5, top: 0, left: 0 }}
					width={props.z.size.w}
					height={props.z.size.h}
				/>
				<canvas
					ref={props.z.aboveLayerRef}
					class="cv-pix"
					style={{ "z-index": 1.5, top: 0, left: 0 }}
					width={props.z.size.w}
					height={props.z.size.h}
				/>
			</div>
		</div>
	);
};

export default Canvas;
