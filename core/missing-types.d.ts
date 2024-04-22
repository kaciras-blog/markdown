/// <reference types="vite/client" />

declare module "markdown-it-footnote" {
	import { PluginSimple } from "markdown-it";
	export default {} as PluginSimple;
}

// 不能直接 export * from ...
declare module "markdown-it/lib/common/utils.mjs" {
	import { escapeHtml, unescapeMd } from "markdown-it/lib/common/utils.js";
	export { unescapeMd, escapeHtml };
}
