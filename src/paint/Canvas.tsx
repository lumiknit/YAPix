import { Component, onMount, onCleanup } from "solid-js";

import { PaintState } from "./state";

import "./index.scss";
import Cursor from "./Cursor";
import { EventBindInfo, mountEvents, unmountEvents } from "./event-handler";
import CanvasBackground from "./CanvasBackground";

type Props = {
	z: PaintState;
};

const Canvas: Component<Props> = props => {
	let rootRef: HTMLDivElement;

	// Set main loop
	let ebi: EventBindInfo | undefined;
	let mainLoop: number = 0;
	onMount(() => {
		ebi = mountEvents(props.z, rootRef);
		mainLoop = setInterval(
			() => props.z.step(),
			1000 / (props.z.config().fps || 60),
		);
	});
	onCleanup(() => {
		unmountEvents(ebi!);
		clearTimeout(mainLoop);
	});

	return (
		<div ref={rootRef!} class="cv-root">
			<Cursor z={props.z} />
			<div
				tabIndex={-1}
				class="cv-view"
				style={
					// DO NOT USE scale in tranform, because the canvas looks blurry in safari.
					{
						transform: `translate(${props.z.display().x}px, ${props.z.display().y}px)`,
					}
				}>
				<canvas
					ref={props.z.focusedLayerRef}
					class="cv-pix"
					style={{
						"z-index": 1,
						top: 0,
						left: 0,
						width: `${props.z.size.w * props.z.display().zoom}px`,
						height: `${props.z.size.h * props.z.display().zoom}px`,
					}}
					width={props.z.size.w}
					height={props.z.size.h}
				/>
				<canvas
					ref={props.z.belowLayerRef}
					class="cv-pix"
					style={{
						"z-index": 0.5,
						top: 0,
						left: 0,
						width: `${props.z.size.w * props.z.display().zoom}px`,
						height: `${props.z.size.h * props.z.display().zoom}px`,
					}}
					width={props.z.size.w}
					height={props.z.size.h}
				/>
				<canvas
					ref={props.z.aboveLayerRef}
					class="cv-pix"
					style={{
						"z-index": 1.5,
						top: 0,
						left: 0,
						width: `${props.z.size.w * props.z.display().zoom}px`,
						height: `${props.z.size.h * props.z.display().zoom}px`,
					}}
					width={props.z.size.w}
					height={props.z.size.h}
				/>
				<CanvasBackground z={props.z} />
			</div>
		</div>
	);
};

export default Canvas;
