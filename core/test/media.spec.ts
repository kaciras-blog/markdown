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

it("should add label section to audio", () => {
	expect(md.render("@audio[foo](bar.opus)")).toMatchSnapshot();
});

it("should escape label from audio", () => {
	expect(md.render("@audio[<xss-tag/>]()")).not.toContain("<xss-tag");
});

it("should escape label from GIF", () => {
	expect(md.render("@gif[<xss-tag/>]()")).not.toContain("<xss-tag");
});

it("should validate video poster link", () => {
	const xss = "javascript:alert('XSS')";
	expect(md.render(`@video[${xss}]()`)).not.toContain("javascript:");
});
