import { Component, For, createMemo, createSignal, onMount } from "solid-js";

import { useDragDropContext } from "@thisbeyond/solid-dnd";
import {
	DragEventHandler,
	DragDropProvider,
	DragDropSensors,
	DragOverlay,
	SortableProvider,
	createSortable,
	closestCenter,
} from "@thisbeyond/solid-dnd";

import { Layer, PaintState, getFocusedLayerCtx } from "@/paint";

import "./LayersModal.scss";
import { TbCopy, TbPlus, TbTrash } from "solid-icons/tb";
import {
	execDeleteLayer,
	execFocusLayer,
	execNewLayerAndFocus,
} from "@/paint/state/action";

type ItemProps = {
	z: PaintState;
	idx: number;
	l: Layer;
};

const LayerItem: Component<ItemProps> = props => {
	let canvasRef: HTMLCanvasElement;
	const sortable = createSortable(props.l.id);
	const [state] = useDragDropContext()!;

	const selected = () => props.z.focusedLayer() === props.idx;

	const focusLayer = (idx: number) => {
		execFocusLayer(props.z, idx);
	};

	onMount(() => {
		const focused = props.z.focusedLayer();
		const previewCtx = canvasRef.getContext("2d")!;

		const d =
			props.idx === focused ? getFocusedLayerCtx(props.z) : props.l.data;

		previewCtx.canvas.width = d.canvas.width;
		previewCtx.canvas.height = d.canvas.height;
		previewCtx.drawImage(d.canvas, 0, 0);
	});

	return (
		<div
			//@ts-ignore
			use:sortable
			class={`sortable pam-item pam-layer ${selected() ? "selected" : ""}`}
			classList={{
				"opacity-25": sortable.isActiveDraggable,
				"transition-transform": true,
			}}
			onClick={() => focusLayer(props.idx)}>
			<canvas ref={canvasRef!} class="pam-layer-preview" />
			{props.l.name}
		</div>
	);
};

type ModalProps = {
	z: PaintState;
};

const LayersModal: Component<ModalProps> = props => {
	const insertNewLayer = () => {
		const ls = props.z.layers();
		const names = new Set(ls.map(l => l.name));
		let cnt = ls.length;
		let name = `Layer ${cnt}`;
		while (names.has(name)) {
			name = `Layer ${++cnt}`;
		}

		execNewLayerAndFocus(props.z, name);
	};

	const deleteSelectedLayer = () => {
		const fl = props.z.focusedLayer();
		execDeleteLayer(props.z, fl);
	};

	const duplicateSelectedLayer = () => {};

	const layers = createMemo(() =>
		props.z
			.layers()
			.map((l, idx) => [idx, l] as const)
			.reverse(),
	);

	const reorderLayers = (layerIDs: string[]) => {
		layerIDs.reverse();

		const focusedLayer = props.z.focusedLayer();
		let newFocusIdx: number | null = null;

		// Convert layers to id-layer map
		props.z.setLayers(ls => {
			const idLayerMap = new Map<string, Layer>();
			ls.forEach(l => idLayerMap.set(l.id, l));

			// Find focused layer index
			newFocusIdx = layerIDs.indexOf(ls[focusedLayer].id);

			const newLayers = layerIDs.map(id => idLayerMap.get(id)!);
			return newLayers;
		});

		props.z.setFocusedLayer(newFocusIdx!);
	};

	const ids = () => layers().map(l => l[1].id);

	const [activeItem, setActiveItem] = createSignal<string | null>(null);

	const handleDragStart: DragEventHandler = ({ draggable }) =>
		setActiveItem(draggable.id as string);

	const handleDragEnd: DragEventHandler = ({ draggable, droppable }) => {
		if (draggable && droppable) {
			const currentItems = ids();
			const fromIndex = currentItems.indexOf(draggable.id as string);
			const toIndex = currentItems.indexOf(droppable.id as string);
			if (fromIndex !== toIndex) {
				const updatedItems = currentItems.slice();
				updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
				console.log(updatedItems);
				reorderLayers(updatedItems);
			}
		}
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

			<DragDropProvider
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				collisionDetector={closestCenter}>
				<DragDropSensors />
				<SortableProvider ids={ids()}>
					<For each={layers()}>
						{([idx, l]) => <LayerItem z={props.z} l={l} idx={idx} />}
					</For>
				</SortableProvider>
				<DragOverlay
					style={{
						"z-index": "200",
					}}>
					<div class="pam-dragging sortable pam-item">{activeItem()}</div>
				</DragOverlay>
			</DragDropProvider>
		</>
	);
};

export default LayersModal;
