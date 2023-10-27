import { expect, it, vi } from "vitest";
import fencePlugin from "../src/web/fence.ts";
import MarkdownIt from "markdown-it";
import { identity } from "@kaciras/utilities/node";

const fn = vi.fn(identity);
const md = new MarkdownIt();
md.use(fencePlugin, fn);

it("should work without language", () => {
	fn.mockImplementationOnce(() => {});
	const html = md.render("```\n<Test>\n```");
	expect(html).toMatchSnapshot();
});

it("should output minimized HTML", () => {
	const html = md.render("```html\nTest\n```");
	expect(html).toMatchSnapshot();
	expect(fn).toHaveBeenCalledWith("Test\n", "html", undefined);
});

it("should parse diff languages", () => {
	const html = md.render("```html diff\nTest\n```");
	expect(html).toMatchSnapshot();
	expect(fn).toHaveBeenCalledWith("Test\n", "html", "diff");
});
