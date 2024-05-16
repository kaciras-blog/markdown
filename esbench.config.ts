import { chromium } from "playwright";
import { defineConfig, PlaywrightExecutor, ViteBuilder } from "esbench/host";
import getConfig from "./vue/vite.config.ts";

const viteConfig = getConfig({ command: "build", mode: "benchmark" });
viteConfig.root = "vue";

export default defineConfig({
	toolchains: [{
		builders: [new ViteBuilder(viteConfig)],
		executors: [new PlaywrightExecutor(chromium)],
	}],
});
