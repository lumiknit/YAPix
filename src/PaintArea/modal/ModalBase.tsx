import { Component } from "solid-js";

type Props = {
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
		<div class="pa-modal-ext" onClick={handleExtClick}>
			<div class="modal-content">
				{props.children}
			</div>
		</div>
	);
};

export default ModalBase;
