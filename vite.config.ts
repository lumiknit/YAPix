import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
	base: "./",
	server: {
		port: 7981,
	},
	preview: {
		port: 7981,
	},
	plugins: [solid()],
	resolve: {
		alias: [{ find: "@", replacement: "/src" }],
	},
});
