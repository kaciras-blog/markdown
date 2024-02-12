import { defineConfig } from "vite";
import nested from "postcss-nested";
import vars from "postcss-simple-vars";
import inlineHTML from "./html-string.ts";
import packageJson from "./package.json" assert { type: "json" };

const deps = Object.keys(packageJson.dependencies);

export default defineConfig({
	plugins: [inlineHTML()],
	css: {
		postcss: {
			plugins: [nested(), vars()],
		},
	},
	build: {
		rollupOptions: {
			treeshake: {
				moduleSideEffects: "no-external",
			},
			external: new RegExp(`^(?:${deps.join("|")})[^?]*$`),
		},
		lib: {
			entry: [
				"src/index.ts",
				"src/activate.ts",
			],
			formats: ["es"],
		},
		target: "esnext",
		outDir: "lib",
		copyPublicDir: false,
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
