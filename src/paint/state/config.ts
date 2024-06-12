import { Accessor, Setter, createSignal } from "solid-js";

import { CompiledPaintConfig, PaintConfig, compilePaintConfig } from "..";

/** An object contains signal of config */
export type WithConfigSignal = {
	originalConfig: PaintConfig;

	config: Accessor<CompiledPaintConfig>;

	setConfig: Setter<CompiledPaintConfig>;
};

/** Install WithPaletteSignal to the object. */
export const installConfigSignal =
	<T extends object>(cfg: PaintConfig) =>
	(target: T): T & WithConfigSignal => {
		const originalConfig = { ...cfg };
		const [config, setConfig] = createSignal<CompiledPaintConfig>(
			compilePaintConfig(cfg),
		);
		return Object.assign(target, {
			originalConfig,
			config,
			setConfig,
		});
	};
