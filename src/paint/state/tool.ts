import { Accessor, Setter, createSignal } from "solid-js";

import { DrawShape, ToolType } from "..";

export type WithToolSettingsSignal = {
	/** Getter for DrawShape */
	drawShape: Accessor<DrawShape>;

	/** Setter for DrawShape */
	setDrawShape: Setter<DrawShape>;

	/** Getter for ToolType */
	toolType: Accessor<ToolType>;

	/** Setter for ToolType */
	setToolType: Setter<ToolType>;
};

export const installToolSettingsSignal = <T extends object>(
	target: T,
): T & WithToolSettingsSignal => {
	const [drawShape, setDrawShape] = createSignal<DrawShape>("line");
	const [toolType, setToolType] = createSignal<ToolType>("brush");
	return Object.assign(target, {
		drawShape,
		setDrawShape,
		toolType,
		setToolType,
	});
};
