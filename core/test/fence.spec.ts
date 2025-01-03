import { expect, it, vi } from "vitest";
import MarkdownIt from "markdown-it";
import { identity } from "@kaciras/utilities/node";
import fence from "../src/web/fence.ts";

const fn = vi.fn(identity);
const md = new MarkdownIt({ highlight: fn });
md.use(fence);

it("should work without language", () => {
	md.render("```\nTest\n```");
	expect(fn).toHaveBeenCalledWith("Test\n", "", "");
});

it("should output minimized HTML", () => {
	const html = md.render("```html\nTest\n```");
	expect(html).toMatchSnapshot();
	expect(fn).toHaveBeenCalledWith("Test\n", "html", "");
});

it("should highlight diff lines", () => {
	const html = md.render("```html diff\n+A\nB\n-C\n```");
	expect(html).toMatchSnapshot();
	expect(fn).toHaveBeenCalledWith("A\nB\nC", "html", "");
});
