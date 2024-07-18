import { Component } from "solid-js";
import { Toaster } from "solid-toast";

import "./App.scss";
import { TopRouter, createRouterState } from "./TopRouter";

const App: Component = () => {
	const routeState = createRouterState("gallery");

	return (
		<div class="app">
			{/* Top components */}
			<Toaster position="top-center" />

			<TopRouter z={routeState} />
		</div>
	);
};

export default App;
