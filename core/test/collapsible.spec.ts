import MarkdownIt from "markdown-it/lib";
import { expect, it } from "vitest";
import Collapsible from "../src/common/collapsible.js";

const markdownIt = new MarkdownIt();
markdownIt.use(Collapsible);

it("should works without summary", () => {
	const html = markdownIt.render(`
<details>
# Test

Inside
</details>
After
	`);
	expect(html).toBe("<details>\n<h1>Test</h1>\n<p>Inside</p>\n</details>\n<p>After</p>\n");
});

it("should render summary", () => {
	const html = markdownIt.render(`
<details>
<summary>
# Some \`code\` text
</summary>
# Test

Inside
</details>`);
	expect(html).toMatchInlineSnapshot(`
		"<details>
		<summary># Some <code>code</code> text</summary>
		<h1>Test</h1>
		<p>Inside</p>
		</details>
		"
	`);
});

it("should restrict summary that must at first", () => {
	const html = markdownIt.render(`
<details>

<summary>
# Header
</summary>
Content
</details>`);

	expect(html).toMatchInlineSnapshot(`
		"<details>
		<summary># Header</summary>
		<p>Content</p>
		</details>
		"
	`);
});

it("should skip broken text", () => {
	const html = markdownIt.render("<details>\nContent");
	expect(html).toBe("<p>&lt;details&gt;\nContent</p>\n");
});

it("should support nesting", () => {
	const html = markdownIt.render("<details>\n<details>\nContent\n</details>\n</details>");
	expect(html).toBe("<details>\n<details>\n<p>Content</p>\n</details>\n</details>\n");
});

it("should able to placed inside blockquote", () => {
	const html = markdownIt.render(
		"> Text Before\n" +
		"> \n" +
		"> <details>\n" +
		"> <summary>\n" +
		"> Description\n" +
		"> </summary>\n" +
		"> Content\n" +
		"> </details>\n" +
		"> \n" +
		"> Text After\n");

	expect(html).toMatchInlineSnapshot(`
		"<blockquote>
		<p>Text Before</p>
		<details>
		<summary>Description</summary>
		<p>Content</p>
		</details>
		<p>Text After</p>
		</blockquote>
		"
	`);
});
