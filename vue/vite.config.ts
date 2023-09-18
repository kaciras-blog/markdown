import { env } from "process";
import { defineConfig, mergeConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueSvgSfc from "vite-plugin-svg-sfc";
import { visualizer } from "rollup-plugin-visualizer";
import coreConfig from "../core/vite.config.ts";
import packageJson from "./package.json" assert { type: "json" };

const deps = Object.keys(packageJson.dependencies);
const re = new RegExp(`^(?:${deps.join("|")})`);

function isExternalForLibrary(id: string) {
	return !id.includes("?sfc") && re.test(id);
}

export default defineConfig(({ mode }) => {
	const overrides = defineConfig({
		// Deployed to https://kaciras-blog.github.io/markdown
		base: env.CI ? "/markdown/" : undefined,
		plugins: [
			vue(),
			vueSvgSfc({ svgProps: attrs => delete attrs.class }),
		],
	});

	if (mode === "lib") {
		coreConfig.build = {
			rollupOptions: {
				external: isExternalForLibrary,
			},
			lib: {
				entry: "src/index.ts",
				formats: ["es"],
				fileName: "index",
			},
			outDir: "lib",
			copyPublicDir: false,
		};
	} else {
		overrides.plugins!.push(visualizer({ emitFile: true }));
	}

	return mergeConfig(coreConfig as UserConfig, overrides);
});
