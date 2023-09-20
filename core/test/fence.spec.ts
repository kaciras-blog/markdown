import { expect, it } from "vitest";
import fencePlugin from "../src/web/fence.ts";
import MarkdownIt from "markdown-it";
import { identity } from "@kaciras/utilities/node";

it("should output minized HTML", () => {
	const md = new MarkdownIt();
	md.use(fencePlugin, identity);
	const html = md.render("```html\nTest\n```");
	expect(html).toMatchSnapshot();
});
