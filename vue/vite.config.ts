import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueSvgSfc from "vite-plugin-svg-sfc";
import nested from "postcss-nested";
import vars from "postcss-simple-vars";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
	css: {
		postcss: {
			plugins: [nested(), vars()],
		},
	},
	plugins: [
		visualizer(),
		vue(),
		vueSvgSfc({ svgProps: attrs => delete attrs.class }),
	],
});
