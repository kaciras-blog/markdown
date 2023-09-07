declare module "markdown-it-footnote" {
	import { PluginSimple } from "markdown-it";
	const plugin: PluginSimple;
	export default plugin;
}

// Processed by vite, see html-string.ts
declare global {
	const $HTML: (..._: unknown[]) => string;
}

export {}; // 不加这个就无法识别上面添加的全局模块。
