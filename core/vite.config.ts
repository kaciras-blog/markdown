import { defineConfig } from "vite";
import nested from "postcss-nested";
import vars from "postcss-simple-vars";
import inlineHTML from "./html-string.ts";
import packageJson from "./package.json" assert { type: "json" };

const deps = Object.keys(packageJson.dependencies);
const re = new RegExp(`^(?:${deps.join("|")})`);

function isExternalForLibrary(id: string) {
	return !id.includes("?") && re.test(id);
}

export default defineConfig({
	plugins: [inlineHTML()],
	css: {
		postcss: {
			plugins: [nested(), vars()],
		},
	},
	build: {
		rollupOptions: {
			output: {
				hoistTransitiveImports: false,
			},
			treeshake: {
				moduleSideEffects: "no-external",
			},
			external: isExternalForLibrary,
		},
		lib: {
			entry: [
				"src/presets.ts",
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
