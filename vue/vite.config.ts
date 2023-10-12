import { defineConfig, mergeConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { visualizer } from "rollup-plugin-visualizer";
import coreConfig from "../core/vite.config.ts";
import packageJson from "./package.json" assert { type: "json" };

const deps = Object.keys(packageJson.dependencies);

export default defineConfig(({ mode }) => {
	const overrides = defineConfig({
		base: "",
		css: {
			modules: {
				generateScopedName: "[hash:base64:5]",
			},
		},
		plugins: [
			vue(),
			mode === "lib" && dts({
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
	 * 结果就是存在了两个 addon-api.ts，这导致了一些无聊的问题，且仅在开发模式下发生。
	 */
	coreConfig.build = {
		rollupOptions: {
			output: {
				hoistTransitiveImports: false,
			},
			external: new RegExp(`^(?:${deps.join("|")})`),
		},
		lib: {
			formats: ["es"],
			entry: [
				"src/entry-view.ts",
				"src/entry-box.ts",
				"src/entry-index.ts",
			],
		},
		target: "esnext",
		outDir: "lib",
		copyPublicDir: false,
	};

	if (mode !== "lib") {
		delete coreConfig.build;
		overrides.plugins!.push(visualizer({ emitFile: true }));
	}

	return mergeConfig(coreConfig as UserConfig, overrides);
});
