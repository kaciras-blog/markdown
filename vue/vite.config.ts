import { env } from "process";
import { defineConfig, mergeConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueSvgSfc from "vite-plugin-svg-sfc";
import { visualizer } from "rollup-plugin-visualizer";
import coreConfig from "../core/vite.config.ts";

export default mergeConfig(coreConfig as UserConfig, defineConfig({
	base: env.CI ? "/markdown/" : undefined,
	plugins: [
		visualizer(),
		vue(),
		vueSvgSfc({ svgProps: attrs => delete attrs.class }),
	],
}));
