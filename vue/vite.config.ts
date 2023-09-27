import { env } from "process";
import { defineConfig, mergeConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { visualizer } from "rollup-plugin-visualizer";
import coreConfig from "../core/vite.config.ts";

const overrides = defineConfig({
	css: {
		modules: {
			generateScopedName: "[hash:base64:5]",
		},
	},
	plugins: [vue(), visualizer({ emitFile: true })],

	// Deployed to https://kaciras-blog.github.io/markdown
	base: env.CI ? "/markdown/" : undefined,
});

delete coreConfig.build;

export default mergeConfig(coreConfig, overrides);
