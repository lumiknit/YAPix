import { Accessor, Component, Setter, Show, createSignal } from "solid-js";
import ModalBase, { ModalPosition } from "./ModalBase";
import { PaintState } from "../../paint";
import PaletteModal from "./PaletteModal";
import BrushModal from "./BrushModal";
import SettingsModal from "./SettingsModal";

/**
 * Create a switch for a modal that can be shown or hidden.
 * If param is not given, it works as a getter.
 * If param is a boolean, it sets the visibility of the modal.
 * If param is a ModalPosition, it sets the position of the modal.
 */
type ModalSwitch = (arg?: boolean | ModalPosition) => ModalPosition | false;

export const createModalSwitch = (
	defaultPosition: ModalPosition,
): ModalSwitch => {
	const [show, setShow] = createSignal(false);
	const obj = {
		show,
		setShow,
		position: defaultPosition,
	};
	return arg => {
		if (typeof arg === "boolean") {
			setShow(arg);
			return arg && obj.position;
		}
		if (arg) {
			obj.position = arg;
		}
		return show() && obj.position;
	};
};

export type ModalSwitches = {
	palette: ModalSwitch;
	brush: ModalSwitch;
	settings: ModalSwitch;
};

export const createModalSwitches = (): ModalSwitches => ({
	palette: createModalSwitch("left"),
	brush: createModalSwitch("left"),
	settings: createModalSwitch("right"),
});

type Props = {
	z: PaintState;
	switches: ModalSwitches;
};

export const Modals: Component<Props> = props => {
	return (
		<>
			<Show when={props.switches.palette()}>
				<ModalBase
					position={props.switches.palette() as any}
					onClose={() => props.switches.palette(false)}>
					<PaletteModal z={props.z} />
				</ModalBase>
			</Show>
			<Show when={props.switches.brush()}>
				<ModalBase
					position={props.switches.brush() as any}
					onClose={() => props.switches.brush(false)}>
					<BrushModal z={props.z} />
				</ModalBase>
			</Show>
			<Show when={props.switches.settings()}>
				<ModalBase
					position={props.switches.settings() as any}
					onClose={() => props.switches.settings(false)}>
					<SettingsModal z={props.z} />
				</ModalBase>
			</Show>
		</>
	);
};
