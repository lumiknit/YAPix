import { Component } from "solid-js";
import toast, { Toaster } from "solid-toast";

import { modal } from "@lumiknit/solid-fekit";

import EditView from "./PaintArea/EditView";

const App: Component = () => {
	return (
		<div class="app">
			{/* Top components */}
			<Toaster position="top-center" />
			<modal.ModalContainer />
			{/* Main paint view */}
			<EditView />
		</div>
	);
};

export default App;
