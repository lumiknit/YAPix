import { Component, Match, Switch, createMemo } from "solid-js";

import { boundaryToRect, rgbaForStyle } from "@/common";

import {
	BRUSH_SHAPE_CURSOR_TOOLS,
	PaintState,
	getBrush,
	getBrushCursorPos,
} from ".";
import { polygonToSVG } from "./polygon";

type Props = {
	z: PaintState;
};

const Cursor: Component<Props> = props => {
	const z = () => props.z.zoom();
	const iz = createMemo(() => 1 / props.z.zoom());

	const strokeWidth = createMemo(() => {
		const zoom = props.z.zoom();
		return zoom > 16 ? 4 : zoom > 8 ? 2 : 1;
	});

	const brushCursorSVGTransform = createMemo(() => {
		const sw = strokeWidth() / 2;
		return `translate(-${sw}px, -${sw}px)`;
	});

	const realCursorTransform = createMemo(() => {
		const z = props.z,
			zoom = z.zoom(),
			cur = z.cursor(),
			x = Math.floor(zoom * cur.real.x),
			y = Math.floor(zoom * cur.real.y);
		return `translate(${x}px, ${y}px)`;
	});

	const brushCursorTransform = createMemo(() => {
		const pos = getBrushCursorPos(props.z);
		const zoom = props.z.zoom();
		return `translate(${Math.floor(zoom * pos.x)}px, ${Math.floor(zoom * pos.y)}px)`;
	});
	const brushW = createMemo(() => {
		const bd = getBrush(props.z).shape.bd;
		return bd.r - bd.l;
	});
	const brushH = createMemo(() => {
		const bd = getBrush(props.z).shape.bd;
		return bd.b - bd.t;
	});

	const viewBox = createMemo(() => {
		const r = boundaryToRect(getBrush(props.z).shape.bd);
		const sw = (strokeWidth() * iz()) / 2;
		return `${r.x - sw} ${r.y - sw} ${r.w + 2 * sw} ${r.h + 2 * sw}`;
	});

	return (
		<>
			<div
				class="cv-real-cursor"
				style={{
					transform: realCursorTransform() + " translate(-50%, -50%)",
					"z-index": 20,
				}}
			/>
			<Switch>
				<Match when={BRUSH_SHAPE_CURSOR_TOOLS.has(props.z.toolType())}>
					<div
						class="cv-cursor"
						style={{
							transform: brushCursorTransform(),
							"z-index": 20,
							"mix-blend-mode": "difference",
						}}>
						<svg
							width={2 * strokeWidth() + z() * brushW()}
							height={2 * strokeWidth() + z() * brushH()}
							viewBox={viewBox()}
							style={{
								transform: brushCursorSVGTransform(),
								stroke: "white",
								"stroke-width": `${strokeWidth() * iz()}px`,
							}}>
							<polygon points={polygonToSVG(getBrush(props.z).shape)} />
						</svg>
					</div>
				</Match>
				<Match when={props.z.drawState()?.tool === "spoid"}>
					<svg
						style={{
							transform: realCursorTransform() + " translate(-50%, -50%)",
							"z-index": 21,
							width: "20rem",
							height: "20rem",
						}}
						viewBox="-1 -1 2 2"
						fill="none"
						stroke-width={0.2}>
						<circle cx="0" cy="0" r="0.5" stroke="#000" stroke-width={0.225} />
						<path
							d="M -0.5 0 A 0.5 0.5 0 0 0 0.5 0"
							stroke={rgbaForStyle(props.z.drawState()!.color)}
						/>
						<path
							d="M -0.5 0 A 0.5 0.5 0 0 1 0.5 0"
							stroke={rgbaForStyle(props.z.drawState()!.initColor)}
						/>
					</svg>
				</Match>
			</Switch>
		</>
	);
};

export default Cursor;
