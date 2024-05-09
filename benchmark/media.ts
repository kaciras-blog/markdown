import { readFileSync } from "fs";
import { defineSuite } from "esbench";
import { MarkdownIt, media } from "../core/lib/index.js";

const article = readFileSync("vue/demo/KFM-zh.md", "utf8");

/*
 * JS 写的解析器（356.02ms）比正则（56.43ms）慢了7倍。
 * 但即便如此，单次渲染时间差也在 1ms 之内。
 */

const markdownIt = new MarkdownIt("zero");
markdownIt.use(media);

export default defineSuite({
	params: {
		text: ["@gif[A [gif] video](/video/foobar.mp4)", article],
	},
	setup(scene) {
		const { text } = scene.params;
		scene.bench("Render", () => markdownIt.render(text));
	},
});
