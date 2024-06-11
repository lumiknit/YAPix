import { Accessor, Component, For, Setter, Show, createSignal } from "solid-js";
import ModalBase, { ModalPosition } from "./ModalBase";
import { PaintState } from "../../paint";
import PaletteModal from "./PaletteModal";
import BrushModal from "./BrushModal";
import SettingsModal from "./SettingsModal";
import LayersModal from "./LayersModal";
import { Dynamic } from "solid-js/web";
import DrawShapeModal from "./DrawShapeModal";

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

export type ModalTypes =
	| "palette"
	| "brush"
	| "drawShape"
	| "layers"
	| "settings";
export const MODAL_INFO: {
	type: ModalTypes;
	position: ModalPosition;
	component: Component<{ z: PaintState }>;
}[] = [
	{
		type: "palette",
		position: "left",
		component: PaletteModal,
	},
	{
		type: "brush",
		position: "left",
		component: BrushModal,
	},
	{
		type: "drawShape",
		position: "left",
		component: DrawShapeModal,
	},
	{
		type: "layers",
		position: "right",
		component: LayersModal,
	},
	{
		type: "settings",
		position: "right",
		component: SettingsModal,
	},
];

export type ModalSwitches = {
	[key in ModalTypes]: ModalSwitch;
};

export const createModalSwitches = (): ModalSwitches => {
	const obj: ModalSwitches = {} as any;
	for (const info of MODAL_INFO) {
		obj[info.type] = createModalSwitch(info.position);
	}
	return obj;
};

type Props = {
	z: PaintState;
	switches: ModalSwitches;
};

const Modals: Component<Props> = props => {
	return (
		<For each={MODAL_INFO}>
			{m => (
				<Show when={props.switches[m.type]()}>
					<ModalBase
						position={props.switches[m.type]() as any}
						onClose={() => props.switches[m.type](false)}>
						<Dynamic component={m.component} z={props.z} />
					</ModalBase>
				</Show>
			)}
		</For>
	);
};

export default Modals;
