import { Component, onMount, onCleanup } from "solid-js";

import { State } from "./state";

import "./index.scss";
import Cursor from "./Cursor";
import { EventBindInfo, mountEvents, unmountEvents } from "./event-handler";

type Props = {
	z: State;
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
