import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { anchor, classify, footnote, sourceLine, ugc } from "../src/index.ts";

describe("sourceLine", () => {
	it("should works", () => {
		const markdownIt = new MarkdownIt();
		markdownIt.use(sourceLine);

		const html = markdownIt.render(`\
# Title

> block 1
>
> block 2
		`);
		expect(html.trimEnd()).toMatchSnapshot();
	});
});

it("should set the attribute", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(ugc);

	const html = markdownIt.render("[test](http://example.com)");
	expect(html.trimEnd()).toBe('<p><a href="http://example.com" rel="ugc,nofollow">test</a></p>');
});

it("should add class to inlined code block", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(classify);

	expect(markdownIt.render("`foobar`")).toMatchSnapshot();
});

it("should add anchor to titles", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(anchor);

	expect(markdownIt.render("# foobar")).toMatchSnapshot();
});

it("should support footnote common", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(footnote);

	const html = markdownIt.render("test[^1]\n\n[^1]: foobar\n\nafter");
	expect(html).toMatchSnapshot();
});
