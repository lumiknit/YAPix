import { idb } from "@lumiknit/solid-fekit";
import { Component, createSignal, onMount } from "solid-js";

type Props = {};

const Gallery: Component<Props> = (props: Props) => {
	const [cnt, setCnt] = createSignal(-1);

	const increment = async () => {
		const [st] = await idb.openIDBStores("test", ["test"], "readwrite");

		const newCnt = cnt() + 1;
		await st.put(newCnt, "cnt");
		setCnt(newCnt);
	};

	onMount(async () => {
		const [st] = await idb.openIDBStores("test", ["test"], "readwrite");

		// Try to get cnt
		const cnt = await st.get("cnt");
		if (cnt === undefined) {
			// Set cnt to 0
			await st.put(0, "cnt");
			setCnt(0);
		} else {
			setCnt(cnt);
		}
	});

	return (
		<div>
			<button onClick={increment}>{cnt()}</button>
		</div>
	);
};

export default Gallery;
