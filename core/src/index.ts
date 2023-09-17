declare global {
	// Processed by Vite, see ../html-string.ts
	const $HTML: (..._: unknown[]) => string;
}

export * from "./directive.ts";
export * from "./miscellaneous.ts";

export { default as Collapsible } from "./collapsible.ts";
export { default as Collect } from "./collect.ts";
export { default as Media } from "./directive.ts";
export { default as TOC } from "markdown-it-toc-done-right";
