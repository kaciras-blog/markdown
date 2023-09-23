import { env } from "process";
import { defineConfig, mergeConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { visualizer } from "rollup-plugin-visualizer";
import coreConfig from "../core/vite.config.ts";
import packageJson from "./package.json" assert { type: "json" };

const deps = Object.keys(packageJson.dependencies);
const re = new RegExp(`^(?:${deps.join("|")})`);

function isExternalForLibrary(id: string) {
	return !id.includes(".svg") && re.test(id);
}

export default defineConfig(({ mode }) => {
	const overrides = defineConfig({
		css: {
			modules: {
				generateScopedName: "[hash:base64:5]",
			},
		},
		plugins: [vue(), dts({
			staticImport: true,
			tsconfigPath: "./tsconfig.build.json",
		})],

		// Deployed to https://kaciras-blog.github.io/markdown
		base: env.CI ? "/markdown/" : undefined,
	});

	if (mode === "lib") {
		coreConfig.build = {
			rollupOptions: {
				external: isExternalForLibrary,
			},
			lib: {
				entry: [
					"src/index.ts",
					"src/only-view.ts",
				],
				formats: ["es"],
			},
			outDir: "lib",
			copyPublicDir: false,
		};
	} else {
		delete coreConfig.build;
		overrides.plugins!.push(visualizer({ emitFile: true }));
	}

	return mergeConfig(coreConfig as UserConfig, overrides);
});
