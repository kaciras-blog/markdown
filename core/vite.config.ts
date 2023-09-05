import { defineConfig } from "vite";
import nested from "postcss-nested";
import vars from "postcss-simple-vars";

export default defineConfig({
	css: {
		postcss: {
			plugins: [nested(), vars()],
		},
	},
	test: {
		clearMocks: true,
		coverage: {
			provider: "v8",
			reporter: ["lcov"],
		},
		include: [
			"test/*.spec.ts",
		],
	},
});
