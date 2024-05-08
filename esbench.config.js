import { defineConfig, ViteBuilder } from "esbench/host";

export default defineConfig({
	toolchains: [{
		builders: [new ViteBuilder()],
	}],
});
