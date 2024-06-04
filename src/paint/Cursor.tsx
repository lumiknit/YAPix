import { Component } from "solid-js";
import { State } from "./state";

type Props = {
	z: State;
};

const Cursor: Component<Props> = props => {
	const x = () =>
		Math.floor(
			props.z.display().x + props.z.cursor().x * props.z.display().zoom,
		);
	const y = () =>
		Math.floor(
			props.z.display().y + props.z.cursor().y * props.z.display().zoom,
		);
	const z = () => Math.floor(props.z.display().zoom);

	return (
		<div
			class="cv-cursor"
			style={{
				transform: `translate(${x()}px, ${y()}px)`,
				"z-index": 2,
			}}>
			<svg
				width={2 + z()}
				height={2 + z()}
				style={{
					transform: `translate(-1px, -1px)`,
				}}>
				// Rect by 1px
				<rect
					x="0"
					y="0"
					width={2 + z()}
					height={2 + z()}
					stroke="red"
					stroke-width="2"
					fill="none"
				/>
			</svg>
		</div>
	);
};

export default Cursor;
