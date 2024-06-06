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
		mainLoop = setInterval(() => props.z.step(), 50);
	});
	onCleanup(() => clearTimeout(mainLoop));

	const getPointerPos = (e: PointerEvent) => {
		const boundRect = rootRef.getBoundingClientRect();
		const originalX = e.clientX - boundRect.left;
		const originalY = e.clientY - boundRect.top;

		return props.z.invertTransform(originalX, originalY);
	};

	const handlePointerDown = (e: PointerEvent) => {
		const [x, y] = getPointerPos(e);
		props.z.pointerDown(x, y);
	};

	const handlePointerMove = (e: PointerEvent) => {
		const [x, y] = getPointerPos(e);
		props.z.updateRealCursor(x, y);
	};

	const handlePointerUp = (e: PointerEvent) => {
		const [x, y] = getPointerPos(e);
		props.z.pointerUp(x, y);
	};

	return (
		<div
			ref={rootRef!}
			class="cv-root"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}>
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
