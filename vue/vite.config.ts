import { env } from "process";
import { defineConfig, mergeConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueSvgSfc from "vite-plugin-svg-sfc";
import { visualizer } from "rollup-plugin-visualizer";
import coreConfig from "../core/vite.config.ts";

export default mergeConfig(coreConfig as UserConfig, defineConfig({
	// Deployed to https://kaciras-blog.github.io/markdown
	base: env.CI ? "/markdown/" : undefined,
	plugins: [
		visualizer({ emitFile: true }),
		vue(),
		vueSvgSfc({ svgProps: attrs => delete attrs.class }),
	],
}));
