// 库模式下会进行处理，但不会出现在生成的 JS 文件中，需要用户手动导入。
import "./web/markdown.css";

export * from "./directive.js";
export * from "./helper.js";
export * from "./miscellaneous.js";
export * from "./activate.js";
export * from "./diagnostics.js";

export { default as MarkdownIt } from "markdown-it";

export { default as toc } from "markdown-it-toc-done-right";
export { default as directive } from "./directive.js";
export { default as div } from "./div.js";
export { default as collapsible } from "./collapsible.js";

export { default as fence } from "./web/fence.js";
export { default as media } from "./web/media.js";
export { default as highlight } from "./web/highlight.js";
