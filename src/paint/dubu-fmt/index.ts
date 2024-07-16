import { Size } from "@/common";
import { LayerInfo } from "../layer";

export type DubuLayer = LayerInfo & {
	size: Size;

	/** Base64 encoded PNG format */
	data: string;
};

export type DubuFmt = {
	/** File name */
	name: string;

	/** Image size */
	size: Size;

	layers: DubuLayer[];
};
