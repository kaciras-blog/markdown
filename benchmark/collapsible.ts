import { defineSuite } from "esbench";
import { collapsible, MarkdownIt } from "../core/lib/index.js";
import article from "../vue/demo/KFM-zh.md?raw";

const markdownIt = new MarkdownIt("zero");
markdownIt.use(collapsible);

export default defineSuite(scene => {
	scene.bench("Render", () => markdownIt.render(article));
});
