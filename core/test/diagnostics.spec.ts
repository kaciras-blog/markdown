import { describe, expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import dedent from "dedent";
import directive from "../src/directive.ts";
import { collect, sourceLine } from "../src/index.ts";

describe("sourceLine", () => {
	it("should works", () => {
		const markdownIt = new MarkdownIt();
		markdownIt.use(sourceLine);

		const html = markdownIt.render(dedent`
			# Title
			
			> block 1
			>
			> block 2
		`);
		expect(html.trimEnd()).toMatchSnapshot();
	});
});

describe("collect", () => {
	it("should collect file links", () => {
		const handler = vi.fn();
		const markdownIt = new MarkdownIt();
		markdownIt.use(directive);
		markdownIt.use(collect, handler);

		markdownIt.render(dedent`
			[](//example.com:123/some-file)
			![](/foo?a=b)
			![empty]()
			@video[](/bar)
			@gif[](http://example.com/favicon.ico)
			
			# H1\nfoobar`,
		);

		expect(handler).toHaveBeenCalledTimes(5);
		expect(handler).toHaveBeenCalledWith("//example.com:123/some-file");
		expect(handler).toHaveBeenCalledWith("/foo?a=b");
		expect(handler).toHaveBeenCalledWith("");
		expect(handler).toHaveBeenCalledWith("/bar");
		expect(handler).toHaveBeenCalledWith("http://example.com/favicon.ico");
	});
});
