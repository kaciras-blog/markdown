import { defineConfig, ViteBuilder, WebRemoteExecutor } from "esbench/host";
import getConfig from "./vue/vite.config.ts";

const viteConfig = getConfig({ command: "build", mode: "benchmark" });
viteConfig.root = "vue";

export default defineConfig({
	toolchains: [{
		builders: [new ViteBuilder(viteConfig)],
		executors: [new WebRemoteExecutor({ open: {} })],
	}],
});
