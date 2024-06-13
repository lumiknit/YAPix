import { Component, onMount, onCleanup, JSX, createMemo } from "solid-js";

import { PaintState, initPaintState, stepForPaintState } from ".";
import Cursor from "./Cursor";
import {
	addGestureListeners,
	createGestureEventContext,
} from "../common/gesture-handler";

import "./index.scss";
import toast from "solid-toast";

type Props = {
	z: PaintState;
};

const Canvas: Component<Props> = props => {
	// Set main loop

	let removeGestureEvents: undefined | (() => void) = undefined;
	let mainLoop: number = 0;
	onMount(() => {
		initPaintState(props.z);

		let gestureCtx = createGestureEventContext({
			captureRef: props.z.rootRef!,
			onPointerDown(e) {
				console.log("pointer down", e);
				toast("pointer down", {
					duration: 300,
				});
			},
			onPointerMove(e) {
				console.log("pointer move", e);
			},
			onPointerUp(e) {
				console.log("pointer up", e);
				toast("pointer up", {
					duration: 300,
				});
			},
			onPointerCancel(e) {
				console.log("pointer cancel", e);
				toast.error("pointer cancel");
			},
			onTap(e) {
				console.log("tap", e);
				const ptr = e.pointers.get(e.id)!;
				toast(`tap #=${e.count} (${ptr.pos.x}, ${ptr.pos.y}) type=${ptr.type}`);
			},
			onLongPress(e) {
				console.log("long press", e);
				const ptr = e.pointers.get(e.id)!;
				toast(
					`long press #=${e.count} (${ptr.pos.x}, ${ptr.pos.y}) type=${ptr.type}`,
				);
			},
			onDragStart(e) {
				console.log("drag start", e);
				const ptr = e.pointers.get(e.id)!;
				toast(`drag start (${ptr.pos.x}, ${ptr.pos.y}) type=${ptr.type}`);
			},
			onDragMove(e) {
				console.log("drag move", e);
			},
			onDragEnd(e) {
				console.log("drag end", e);
				const ptr = e?.pointers.get(e.id);
				toast(`drag end (${ptr?.pos.x}, ${ptr?.pos.y}) type=${ptr?.type}`);
			},
			onPinchStart(e) {
				console.log("pinch start", e);
				const ptr = e.pointers.get(e.id)!;
				toast(`pinch start type=${ptr.type}`);
			},
			onPinchMove(e) {
				console.log("pinch move", e);
			},
			onPinchEnd(e) {
				console.log("pinch end", e);
				const ptr = e?.pointers.get(e.id);
				toast(
					`pinch end scale=${e?.scale} rotate=${e?.rotation} translate=(${e?.translation.x}, ${e?.translation.y}) type=${ptr?.type}`,
				);
			},
		});
		removeGestureEvents = addGestureListeners(props.z.rootRef!, gestureCtx);
		mainLoop = setInterval(
			() => stepForPaintState(props.z),
			1000 / (props.z.config().fps || 60),
		);
	});
	onCleanup(() => {
		if (removeGestureEvents) {
			removeGestureEvents();
		}
		clearTimeout(mainLoop);
	});

	const canvasStyle = (
		zIndex: number,
		x: number,
		y: number,
	): JSX.CSSProperties => {
		const zoom = props.z.zoom();
		const size = props.z.size();
		return {
			"z-index": `${zIndex}`,
			top: `${x}px`,
			left: `${y}px`,
			width: `${size.w * zoom}px`,
			height: `${size.h * zoom}px`,
		};
	};

	const canvasTransform = createMemo(() => {
		const d = props.z.scroll();
		return `translate(${d.x}px, ${d.y}px)`;
	});

	return (
		<div ref={props.z.rootRef} class="cv-root">
			<Cursor z={props.z} />
			<div
				tabIndex={-1}
				class="cv-view"
				style={
					// DO NOT USE scale in tranform, because the canvas looks blurry in safari.
					{
						transform: canvasTransform(),
					}
				}>
				<canvas
					ref={props.z.tempLayerRef}
					class="cv-pix"
					style={canvasStyle(6, 0, 0)}
					width={props.z.size().w}
					height={props.z.size().h}
				/>
				<canvas
					ref={props.z.focusedLayerRef}
					class="cv-pix"
					style={{
						...canvasStyle(5, 0, 0),
						visibility: props.z.showFocusedLayer() ? "visible" : "hidden",
					}}
					width={props.z.size().w}
					height={props.z.size().h}
				/>
				<canvas
					ref={props.z.belowLayerRef}
					class="cv-pix"
					style={canvasStyle(4, 0, 0)}
					width={props.z.size().w}
					height={props.z.size().h}
				/>
				<canvas
					ref={props.z.aboveLayerRef}
					class="cv-pix"
					style={canvasStyle(9, 0, 0)}
					width={props.z.size().w}
					height={props.z.size().h}
				/>
			</div>
		</div>
	);
};

export default Canvas;
