import { expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import div from "../src/div.ts";
import dedent from "dedent";

const md = new MarkdownIt();
md.use(div);

function t(input: string, expected: string) {
	const html = md.render(dedent(input));
	expected = dedent(expected);
	return () => expect(html.trim()).toBe(expected);
}

it("should skip without class", t(`
	:::
	This is a warning.
	:::
`, `
	<p>:::
	This is a warning.
	:::</p>
`));

it("should works", t(`
	::: warning
	This is a warning.
	:::
`, `
	<div class="alert warning">
	<p>This is a warning.</p>
	</div>
`));

it("should support nesting", t(`
	::: warning
	This is a warning.
	
	::: info
	This is an info box.
	:::
	:::
`, `
	<div class="alert warning">
	<p>This is a warning.</p>
	<div class="alert info">
	<p>This is an info box.</p>
	</div>
	</div>
`));

it("should skip broken text", t(`
	::: warning
	This is a warning.
	
	This is a warning.
`, `
	<p>::: warning
	This is a warning.</p>
	<p>This is a warning.</p>
`));
