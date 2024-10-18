import { expect, it } from "vitest";
import highlight from "../src/web/highlight.ts";
import hljs from "highlight.js/lib/core";
import { readFileSync } from "fs";

it("should work without diff", () => {
	expect(highlight("+A\n-B\nC", "ini")).toMatchSnapshot();
});

it("should only escape HTML for unknown language", () => {
	expect(highlight("<foo>", "UNKNOWN")).toBe("&lt;foo&gt;");
});

it("should only escape HTML without language", () => {
	expect(highlight("<foo>", "")).toBe("&lt;foo&gt;");
});

/**
 * 该测试涉及大量 HTML 字符串，写在 JS 里不好看，所以把它们搞到了 HTML 文件里。
 *
 * @param fixture 测试数据文件的名字
 */
function useFixture(fixture: string) {
	return () => {
		const html = readFileSync(`test/fixtures/${fixture}.html`, "utf8");
		const [sfc, expected] = html.split("--------");
		const actual = highlight(sfc.trimEnd(), "vue");
		expect(actual).toBe(expected.trim()); // git 可能在后面加空行，要 trim 一下。
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
