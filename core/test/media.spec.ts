import { expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import clientMediaPlugin from "../src/web/media.ts";

const md = new MarkdownIt();
md.use(clientMediaPlugin);

it("should output minimized HTML", () => {
	expect(md.render("@video[](/file.mp4)")).toMatchSnapshot();
});

it("should replace builtin image renderer", () => {
	expect(md.render("![label](/file.png)")).toMatchSnapshot();
});

it("should add aspect ratio to style", () => {
	expect(md.render("![label](/file.png?vw=11&vh=22)")).toMatchSnapshot();
});
