import { expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import div from "../src/div.ts";

const md = new MarkdownIt();
md.use(div);

it('should skip without class', () => {
	const html = md.render(`\
:::
This is a warning.
:::`);
	expect(html).toBe(`\
<p>:::
This is a warning.
:::</p>
`);
});

it("should works", () => {
	const html = md.render(`\
::: warning
This is a warning.
:::`);

	expect(html).toBe(`\
<div class="alert warning">
<p>This is a warning.</p>
</div>
`);
});

it("should support nesting", () => {
	const html = md.render(`\
::: warning
This is a warning.

::: info
This is an info box.
:::
:::`);

	expect(html).toBe(`\
<div class="alert warning">
<p>This is a warning.</p>
<div class="alert info">
<p>This is an info box.</p>
</div>
</div>
`);
});

it("should skip broken text", () => {
	const html = md.render(`\
::: warning
This is a warning.

This is a warning.
`);

	expect(html).toBe(`\
<p>::: warning
This is a warning.</p>
<p>This is a warning.</p>
`);
});
