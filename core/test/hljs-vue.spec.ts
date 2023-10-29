import { readFileSync } from "fs";
import { expect, it } from "vitest";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import scss from "highlight.js/lib/languages/scss";
import vue from "../src/web/hljs-vue.ts";

const highlighter = hljs.newInstance();
highlighter.registerLanguage("xml", xml);
highlighter.registerLanguage("javascript", javascript);
highlighter.registerLanguage("typescript", typescript);
highlighter.registerLanguage("scss", scss);
highlighter.registerLanguage("css", css);
highlighter.registerLanguage("vue", vue);

/**
 * 该测试涉及大量 HTML 字符串，写在 JS 里不好看，所以把它们搞到了 HTML 文件里。
 *
 * @param fixture 测试数据文件的名字
 */
function doTest(fixture: string) {
	const html = readFileSync(`test/fixtures/${fixture}.html`, "utf8");
	const [sfc, output] = html.split("--------");
	const r = highlighter.highlight(sfc.trimEnd(), { language: "vue" });
	expect(r.value).toBe(output.trim()); // git 可能在后面加空行，要 trim 一下。
}

it("should parse blocks", () => doTest("simple"));

it("should recognize language of blocks", () => doTest("block-lang"));

it("should work with multiple attrs in blocks", () => doTest("block-attrs"));

it("should work with unknown languages", () => doTest("unknown-lang"));
