import { Component, For, onMount } from "solid-js";

import { PaintState, executeAction, getFocusedLayerCtx } from "@/paint";

import "./LayersModal.scss";
import { TbCopy, TbPlus, TbTrash } from "solid-icons/tb";
import { NewLayerAction } from "@/paint/actions";
import {
	execDeleteLayer,
	execFocusLayer,
	execNewLayerAndFocus,
} from "@/paint/state/action";

type Props = {
	z: PaintState;
};

const LayersModal: Component<Props> = props => {
	const canvasRefs: HTMLCanvasElement[] = [];

	const selected = (idx: number) => props.z.focusedLayer() === idx;

	onMount(() => {
		const layers = props.z.layers();
		const focused = props.z.focusedLayer();
		for (let i = 0; i < layers.length; i++) {
			const previewCtx = canvasRefs[i].getContext("2d")!;

			const d = i === focused ? getFocusedLayerCtx(props.z) : layers[i].data;

			previewCtx.canvas.width = d.canvas.width;
			previewCtx.canvas.height = d.canvas.height;
			previewCtx.drawImage(d.canvas, 0, 0);
		}
	});

	const insertNewLayer = () => {
		execNewLayerAndFocus(props.z, "Layer 0");
	};

	const deleteSelectedLayer = () => {
		const fl = props.z.focusedLayer();
		execDeleteLayer(props.z, fl);
	};

	const duplicateSelectedLayer = () => {};

	const focusLayer = (idx: number) => {
		execFocusLayer(props.z, idx);
	};

	const len = () => props.z.layers().length;

	const reversedLayers = () => {
		const ls = [...props.z.layers()];
		ls.reverse();
		return ls;
	};

	return (
		<>
			<div class="pa-modal-title">
				Layers
				<div>
					<button onClick={deleteSelectedLayer}>
						<TbTrash />
					</button>
					<button onClick={duplicateSelectedLayer}>
						<TbCopy />
					</button>
					<button onClick={insertNewLayer}>
						<TbPlus />
					</button>
				</div>
			</div>

			<For each={reversedLayers()}>
				{(l, idx) => (
					<div
						class={`pam-item pam-layer ${selected(len() - idx() - 1) ? "selected" : ""}`}
						onClick={() => focusLayer(len() - idx() - 1)}>
						<canvas
							ref={canvasRefs[len() - idx() - 1]}
							class="pam-layer-preview"
						/>
						{l.name}
					</div>
				)}
			</For>
		</>
	);
};

export default LayersModal;
