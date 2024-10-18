import { defineConfig, mergeConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { visualizer } from "rollup-plugin-visualizer";
import coreConfig from "../core/vite.config.ts";
import packageJson from "./package.json" with { type: "json" };

const deps = Object.keys(packageJson.dependencies);

/**
 * 通过 Rollup 的 manualChunk 手动配置下文件名，避免 Vue 产生额外的 JS 文件。
 * 22 年的问题到现在都不解决：https://github.com/vitejs/vite-plugin-vue/issues/19
 */
function preventReExports(id: string) {
	return /(MarkdownView|MarkdownBox)\.vue/.exec(id)?.[1];
}

export default defineConfig(({ mode }) => {
	const overrides = defineConfig({
		base: "",
		css: {
			modules: {
				generateScopedName: "[hash:base64:5]",
			},
		},
		build: {
			target: "esnext",
		},
		plugins: [
			vue(),
			mode === "lib" && dts({
				cleanVueFileName: true,
				staticImport: true,
				tsconfigPath: "./tsconfig.lib.json",
			}),
		],
	});

	/*
	 * 发布为库的时候必须构建，不能直接放源码，因为 Vite 开发模式会预先构建并缓存依赖，
	 * 该过程不支持 .vue 文件，考虑如下情况：
	 *
	 * - 项目中引用了 MarkdownEditor.vue，但它不被预购建，所以解析到源文件。
	 * - 另一处引用了 addon-api.ts，它被预构建为缓存。
	 * - MarkdownEditor.vue 引用了 addon-api.ts，当然也解析到源文件。
	 *
	 * 结果就是存在了两份 addon-api.ts，导致了一些无聊的问题，且仅在开发模式下发生。
	 */
	coreConfig.build = {
		rollupOptions: {
			output: {
				manualChunks: preventReExports,
			},
			external: new RegExp(`^(?:${deps.join("|")})`),
		},
		outDir: "lib",
		copyPublicDir: false,
		lib: {
			formats: ["es"],
			entry: [
				"src/index.ts",
				"src/MarkdownView.vue",
				"src/MarkdownBox.vue",
			],
		},
	};

	if (mode !== "lib") {
		delete coreConfig.build;
		overrides.plugins!.push(visualizer({ emitFile: true }));
	}

	return mergeConfig(coreConfig as UserConfig, overrides);
});
