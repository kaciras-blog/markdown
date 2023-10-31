import { expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import directive from "../src/directive.ts";
import collect from "../src/collect.ts";

it("should collect file links", () => {
	const handler = vi.fn();
	const markdownIt = new MarkdownIt();
	markdownIt.use(directive);
	markdownIt.use(collect, handler);

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
