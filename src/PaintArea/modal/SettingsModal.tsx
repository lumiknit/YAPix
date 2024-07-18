import { Component } from "solid-js";

import {
	PaintState,
	executeAction,
	fitCanvasToRoot,
	mergeLayersWithNewCtx,
	rerenderLayers,
	updateFocusedLayerData,
} from "@/paint";
import { ctxToBlob } from "@/common";
import { TbBrandGithub } from "solid-icons/tb";
import toast from "solid-toast";
import { packIntoDubuFmt, unpackFromDubuFmt } from "@/paint/state/comp-file";
import { execAction } from "@/paint/state/action";

type Props = {
	z: PaintState;
};

const SettingsModal: Component<Props> = props => {
	let changeSizeWidthRef: HTMLInputElement;
	let changeSizeHeightRef: HTMLInputElement;

	const handleImportImage = (e: Event) => {
		// Load file blob
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		console.log(file);
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const ctx = props.z.focusedLayerRef!.getContext("2d");
				if (!ctx) return;
				ctx.drawImage(img, 0, 0);
			};
			img.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	};

	const handleSaveTemp = async () => {
		updateFocusedLayerData(props.z);
		const dubu = await packIntoDubuFmt(props.z);
		localStorage.setItem("dubu-temp", JSON.stringify(dubu));
		toast.success("Saved temp");
	};

	const handleLoadTemp = async () => {
		const dubuText = localStorage.getItem("dubu-temp");
		console.log(dubuText);
		if (!dubuText) {
			toast.error("No temp data");
			return;
		}

		let dubu;
		try {
			dubu = JSON.parse(dubuText);
		} catch (e) {
			toast.error("Temp data was corrupted");
			return;
		}
		// Load the data
		await unpackFromDubuFmt(props.z, dubu);
		rerenderLayers(props.z);
		toast.success("Loaded temp");
	};

	const handleEnterFullscreen = () => {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen();
		}
	};

	return (
		<>
			<div class="pa-modal-title">Settings / Files</div>

			<div> About </div>

			<a class="pam-item" href="https://github.com/lumiknit/dubu-tl">
				<span>
					<TbBrandGithub />
					https://github.com/lumiknit/dubu-tl
				</span>
			</a>

			<div> File </div>

			<div class="pam-item" onClick={handleSaveTemp}>
				Save temp
			</div>

			<div class="pam-item" onClick={handleLoadTemp}>
				Load temp
			</div>

			<div> Other </div>

			<div class="pam-item" onClick={handleEnterFullscreen}>
				Fullscreen
			</div>

			<div
				class="pam-item"
				onClick={() => {
					fitCanvasToRoot(props.z);
				}}>
				Reset Zoom
			</div>

			<div> Files </div>

			<div
				class="pam-item"
				onClick={() => {
					const ctx = mergeLayersWithNewCtx(props.z, 4);
					const blob = ctxToBlob(ctx);
					blob.then(b => {
						const url = URL.createObjectURL(b);
						const a = document.createElement("a");
						a.href = url;
						a.download = "image.png";
						a.click();
						URL.revokeObjectURL(url);
					});
				}}>
				Export
			</div>

			<div class="pam-item">
				<span class="label">Import image </span>
				<input type="file" accept="image/*" onInput={handleImportImage} />
			</div>

			<hr />
			<h3> Change Canvas Size </h3>
			<div class="pam-item">
				<span class="label"> Width </span>
				<input
					ref={changeSizeWidthRef!}
					type="number"
					value={props.z.size().width}
				/>
			</div>
			<div class="pam-item">
				<span class="label"> Height </span>
				<input
					ref={changeSizeHeightRef!}
					type="number"
					value={props.z.size().height}
				/>
			</div>
			<div class="pam-item">
				<button
					onClick={() => {
						const width = Number(changeSizeWidthRef.value);
						const height = Number(changeSizeHeightRef.value);
						if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
							toast.error("Invalid size");
							return;
						}
						executeAction(props.z, [
							{
								type: "changeCanvasSize",
								next: {
									width,
									height,
								},
							},
						]);
					}}>
					{" "}
					Change{" "}
				</button>
			</div>
		</>
	);
};

export default SettingsModal;
