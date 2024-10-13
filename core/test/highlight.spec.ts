import { expect, it } from "vitest";
import highlight from "../src/web/highlight.ts";
import dedent from "dedent";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/*";
import javascript from "highlight.js/lib/languages/*";
import typescript from "highlight.js/lib/languages/*";
import scss from "highlight.js/lib/languages/*";
import css from "highlight.js/lib/languages/*";
import { readFileSync } from "fs";

it("should support diff syntax", () => {
	expect(highlight("+A\n-B\nC", "ini", "diff")).toMatchSnapshot();
});

it("should work without diff", () => {
	expect(highlight("+A\n-B\nC", "ini")).toMatchSnapshot();
});

it("should only escape HTML for unknown language", () => {
	expect(highlight("<foo>", "UNKNOWN")).toBe("&lt;foo&gt;");
});

it("should only escape HTML without language", () => {
	expect(highlight("<foo>", "")).toBe("&lt;foo&gt;");
});

it("should support diff for unknown language", () => {
	expect(highlight("+A\n-B\nC", "UNKNOWN", "diff")).toMatchSnapshot();
});

it("should avoid", () => {
	const code = dedent`
+		return (
+			<i 
+				className={styles.tile}
+			/>,
+		);
	`;
	expect(highlight(code, "jsx", "diff")).toBe("");
});

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
function useFixture(fixture: string) {
	return () => {
		const html = readFileSync(`test/fixtures/${fixture}.html`, "utf8");
		const [sfc, expected] = html.split("--------");
		const r = highlighter.highlight(sfc.trimEnd(), { language: "vue" });
		expect(r.value).toBe(expected.trim()); // git 可能在后面加空行，要 trim 一下。
	};
}

it("should parse blocks", useFixture("simple"));

it("should recognize language of blocks", useFixture("block-lang"));

it("should work with multiple attrs in blocks", useFixture("block-attrs"));

it("should work with unknown languages", useFixture("unknown-lang"));

it("highlight.js does not have builtin support for SFC", () => {
	expect(hljs.vuePlugin).toBeUndefined();
	return expect(import("highlight.js/lib/languages/vue")).rejects.toThrow();
});
