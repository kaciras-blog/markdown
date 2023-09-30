import { performance } from "perf_hooks";
import { readFileSync } from "fs";
import { Footnote, MarkdownIt, Media, TOC } from "@kaciras-blog/markdown";

/*
 * JS 写的解析器（356.02ms）比正则（56.43ms）慢了7倍。
 * 但即便如此，单次渲染时间差也在 1ms 之内。
 */

const markdownIt = new MarkdownIt();
markdownIt.use(TOC);
markdownIt.use(Media);
markdownIt.use(Footnote);

function run(name, text) {

	function iter() {
		for (let i = 0; i < 1000; i++) markdownIt.render(text);
	}

	// warm up
	iter();

	const start = performance.now();
	iter();
	const end = performance.now();

	console.log("\n" + name);
	console.log(`${((end - start) / 1000).toFixed(3)} ms`);
}

run("normal", "@gif[A [gif] video](/video/foobar.mp4)");

run("non-match", `
# 视频好处都有啥

视频是个好东西啊，它要不好现在的直播弹幕短视频怎么火的

@example.com: 这是我看到的最多的做法，其优势就是简单
`);

run("article", readFileSync("markdown.txt", "utf8"));
