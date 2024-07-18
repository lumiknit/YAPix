import { Size } from "@/common";
import { LayerInfo } from "../layer";

export type DubuLayer = LayerInfo & {
	size: Size;

	/** Base64 encoded PNG format */
	data: string;
};

export const DUBU_FMT_VERSION = 0;

export type DubuFmt = {
	/** Version */
	version: number;

	/** File name */
	name: string;

	/** Image size */
	size: Size;

	layers: DubuLayer[];
};
