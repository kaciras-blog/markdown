import { expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import MediaPlugin from "../src/common/directive.js";
import { Anchor, Classify, Collect, Footnote } from "../src/common/index.js";

it("should add class to inlined code block", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(Classify);

	expect(markdownIt.render("`foobar`")).toMatchSnapshot();
});

it("should add anchor to titles", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(Anchor);

	expect(markdownIt.render("# foobar")).toMatchSnapshot();
});

it("should support footnote common", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(Footnote);

	const html = markdownIt.render("test[^1]\n\n[^1]: foobar\n\nafter");
	expect(html).toMatchSnapshot();
});

it("should collect file links", () => {
	const handler = vi.fn();
	const markdownIt = new MarkdownIt();
	markdownIt.use(MediaPlugin);
	markdownIt.use(Collect, handler);

	const lines = [
		"[](//example.com:123/some-file)",
		"![](/foo?a=b)",
		"![empty]()",
		"@video[](/bar)",
		"@gif[](http://example.com/favicon.ico)",

		"# H1\nfoobar",
	];
	markdownIt.render(lines.join("\n\n"));

	expect(handler).toHaveBeenCalledTimes(5);
	expect(handler).toHaveBeenCalledWith("//example.com:123/some-file");
	expect(handler).toHaveBeenCalledWith("/foo?a=b");
	expect(handler).toHaveBeenCalledWith("");
	expect(handler).toHaveBeenCalledWith("/bar");
	expect(handler).toHaveBeenCalledWith("http://example.com/favicon.ico");
});
