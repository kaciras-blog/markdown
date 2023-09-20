declare global {
	// Processed by Vite, see ../html-string.ts
	const $HTML: (..._: unknown[]) => string;
}

import "./web/markdown.css";

export * from "./directive.ts";
export * from "./helper.ts";
export * from "./miscellaneous.ts";
export * from "./web/activate.ts";

export { default as TOC } from "markdown-it-toc-done-right";
export { default as Collect } from "./collect.ts";
export { default as Directive } from "./directive.ts";
export { default as Collapsible } from "./collapsible.ts";

export { default as Fence } from "./web/fence.ts";
export { default as Media } from "./web/media.ts";
export { default as highlight } from "./web/highlight.ts";
