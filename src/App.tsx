import { Component } from "solid-js";
import { Toaster } from "solid-toast";

import EditView from "@/PaintArea/EditView";

import "./App.scss";

const App: Component = () => {
	return (
		<div class="app">
			{/* Top components */}
			<Toaster position="top-center" />
			{/* Main paint view */}
			<EditView />
		</div>
	);
};

export default App;
