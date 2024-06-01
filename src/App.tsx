import { Component } from "solid-js";
import { State } from "./imgt/state";
import Canvas from "./imgt/Canvas";

const App: Component = () => {
	let state = new State(32, 32);

	return (
		<div class="app">
			<div class="w-canvas">
				<Canvas z={state} />
			</div>
			<div class="w-tools">
				<button
					onClick={() => state.setDisplay(s => ({ ...s, zoom: s.zoom * 1.1 }))}>
					{" "}
					Zoom In{" "}
				</button>
				<button
					onClick={() => state.setDisplay(s => ({ ...s, zoom: s.zoom / 1.1 }))}>
					{" "}
					Zoom Out{" "}
				</button>
				<button onClick={() => state.setDisplay(s => ({ ...s, x: s.x + 10 }))}>
					{" "}
					Move Right{" "}
				</button>
				<button onClick={() => state.setDisplay(s => ({ ...s, x: s.x - 10 }))}>
					{" "}
					Move Left{" "}
				</button>
				<button onClick={() => state.setDisplay(s => ({ ...s, y: s.y + 10 }))}>
					{" "}
					Move Down{" "}
				</button>
				<button onClick={() => state.setDisplay(s => ({ ...s, y: s.y - 10 }))}>
					{" "}
					Move Up{" "}
				</button>
			</div>
		</div>
	);
};

export default App;
