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
	build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
					const names = id.split("node_modules/");
					if (names.length > 1) {
						const name = names.pop()!.split("/")[0];
						return `vendor-${name}`;
					}
        },
      },
    },
  },
});
