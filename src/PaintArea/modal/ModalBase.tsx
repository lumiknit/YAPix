import { Component } from "solid-js";

import "./common.scss";

export type ModalPosition = "left" | "right" | "bottom" | "center";

type Props = {
	position: ModalPosition;
	onClose: () => void;
	children: any;
};

export const ModalBase: Component<Props> = props => {
	const handleExtClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			props.onClose();
		}
	};
	return (
		<div class={"pa-modal-ext " + props.position} onClick={handleExtClick}>
			<div class="pa-modal-content">{props.children}</div>
		</div>
	);
};

export default ModalBase;
