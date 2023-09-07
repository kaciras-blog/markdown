import { expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { clientMediaPlugin } from "../src/web/media.ts";

it("should output minimized HTML", () => {
	const md = new MarkdownIt();
	md.use(clientMediaPlugin);

	const html = md.render("@video[](/file.mp4)");
	expect(html).toMatchSnapshot();
});
