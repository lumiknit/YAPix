import { Component, createSignal, onMount } from "solid-js";
import { createState } from "./imgt/state";
import Canvas from "./imgt/Canvas";

const App: Component = () => {
	let state = createState(64, 64);

	return (
		<>
			<Canvas z={state} />
			<div>YAPix</div>
		</>
	);
};

export default App;
