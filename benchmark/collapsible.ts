import { readFileSync } from "fs";
import { defineSuite } from "esbench";
import { collapsible, MarkdownIt } from "../core/lib/index.js";

const article = readFileSync("vue/demo/KFM-zh.md", "utf8");

const markdownIt = new MarkdownIt("zero");
markdownIt.use(collapsible);

export default defineSuite(scene => {
	scene.bench("Render", () => markdownIt.render(article));
});
