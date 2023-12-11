/// <reference types="vite/client" />

declare module "markdown-it-footnote" {
	import { PluginSimple } from "markdown-it";
	const footnotePlugin: PluginSimple;
	export default footnotePlugin;
}

declare module "markdown-it/lib/common/utils.mjs" {
	import * as utils from "markdown-it/lib/common/utils.js";
	export = utils; // 不能直接 export * from ...
}
