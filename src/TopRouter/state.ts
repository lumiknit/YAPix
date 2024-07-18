import { Gallery } from "@/Gallery";
import { EditView } from "@/PaintArea";
import { Accessor, Component, Setter, createSignal } from "solid-js";

export type PageType = "gallery" | "edit";

export type ChangePageFn = (p: PageType) => void;
export type WithChangePageFn = {
	changePage: ChangePageFn;
};

export const PAGES: { [key in PageType]: Component<WithChangePageFn> } = {
	gallery: Gallery,
	edit: EditView,
};

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
