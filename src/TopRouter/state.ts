import { Gallery } from "@/Gallery";
import { EditView } from "@/PaintArea";
import { Accessor, Setter, createSignal } from "solid-js";

export const PAGES = {
	gallery: Gallery,
	edit: EditView,
};

export type PageType = keyof typeof PAGES;

export type RouterState = {
	current: Accessor<PageType>;
	setCurrent: Setter<PageType>;
};

export const createRouterState = (initial: PageType): RouterState => {
	const [current, setCurrent] = createSignal<PageType>(initial);
	return {
		current,
		setCurrent,
	};
};
