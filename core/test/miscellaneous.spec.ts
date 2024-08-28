import { expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import * as exports from "../src/index.ts";

const all = Object.values(exports);

it("should set the attribute", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(exports.ugc);

	const html = markdownIt.render("[test](https://example.com)");
	expect(html.trimEnd()).toBe('<p><a href="https://example.com" rel="ugc,nofollow">test</a></p>');
});

it("should add class to inlined code block", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(exports.classify);

	expect(markdownIt.render("`foobar`")).toMatchSnapshot();
});

it("should add anchor to titles", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(exports.anchor);

	expect(markdownIt.render("# foobar")).toMatchSnapshot();
});

it("should add docId to anchor link", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(exports.anchor);

	expect(markdownIt.render("# foobar", { docId: 8964 })).toMatchSnapshot();
});

it("should support footnote common", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(exports.footnote);

	const html = markdownIt.render("test[^1]\n\n[^1]: foobar\n\nafter");
	expect(html).toMatchSnapshot();
});

it.each([{
	options: undefined,
	plugins: [
		exports.kfmPreset,
		exports.anchor,
		exports.fence,
		exports.media,
		exports.directive,
		exports.classify,
		exports.toc,
		exports.div,
		exports.footnote,
		exports.collapsible,
	],
},{
	options: { plain: true },
	plugins: [
		exports.kfmPreset,
		exports.directive,
		exports.toc,
		exports.div,
		exports.footnote,
		exports.collapsible,
	],
}, {
	options: { guest: true },
	plugins: [
		exports.kfmPreset,
		exports.fence,
		exports.media,
		exports.directive,
		exports.classify,
		exports.ugc,
		exports.div,
		exports.footnote,
		exports.collapsible,
	],
}])("should apply plugins for preset $options", input => {
	const markdownIt = new MarkdownIt();
	const spy  = vi.spyOn(markdownIt, "use");

	markdownIt.use(exports.kfmPreset, input.options);

	const names = spy.mock.calls
		.map(args => args[0])
		.filter(plugin => all.includes(plugin));

	expect(names).toStrictEqual(input.plugins);
});
