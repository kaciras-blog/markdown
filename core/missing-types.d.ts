/// <reference types="vite/client" />

declare module "markdown-it-footnote" {
	import { PluginSimple } from "markdown-it";
	const footnotePlugin: PluginSimple;
	export default footnotePlugin;
}
