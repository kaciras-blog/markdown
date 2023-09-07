import { defineConfig } from "vite";
import nested from "postcss-nested";
import vars from "postcss-simple-vars";
import inlineHTML from "./html-string.ts";

export default defineConfig({
	plugins: [inlineHTML()],
	css: {
		postcss: {
			plugins: [nested(), vars()],
		},
	},
	test: {
		clearMocks: true,
		coverage: {
			reporter: ["lcov"],
			provider: "v8",
		},
		include: ["test/**/*.spec.ts"],
	},
});
