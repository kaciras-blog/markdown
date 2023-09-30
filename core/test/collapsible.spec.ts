import MarkdownIt from "markdown-it/lib";
import { expect, it } from "vitest";
import Collapsible from "../src/collapsible.ts";

const markdownIt = new MarkdownIt();
markdownIt.use(Collapsible);

function t(input: string, expected: string) {
	expected = expected.slice(1); // 移除开头的空行。
	return () => expect(markdownIt.render(input)).toBe(expected);
}

it("should works without summary", t(`
<details>
# Test

Inside
</details>
After
`, `
<details>
<h1>Test</h1>
<p>Inside</p>
</details>
<p>After</p>
`));

it("should render summary", t(`
<details>
<summary>
# Some \`code\` text
</summary>
# Test

Inside
</details>
`, `
<details>
<summary># Some <code>code</code> text</summary>
<h1>Test</h1>
<p>Inside</p>
</details>
`));

it("should restrict summary that must at first", t(`
<details>

<summary>
# Header
</summary>
Content
</details>
`, `
<details>
<summary># Header</summary>
<p>Content</p>
</details>
`));

it("should skip broken text",  t(`
<details>
Content
`,`
<p>&lt;details&gt;
Content</p>
`));

it("should able to placed inside blockquote",  t(`
<details>
<details>
Content
</details>
</details>
`,`
<details>
<details>
<p>Content</p>
</details>
</details>
`));

it("should able to placed inside blockquote",  t(`
> Text Before
> 
> <details>
> <summary>
> Description
> </summary>
> Content
> </details>
> 
> Text After
`,`
<blockquote>
<p>Text Before</p>
<details>
<summary>Description</summary>
<p>Content</p>
</details>
<p>Text After</p>
</blockquote>
`));

it("should restrict details position",  t(`
<details>
Content
<summary>
Description
</summary>
</details>
`,`
<details>
<p>Content
&lt;summary&gt;
Description
&lt;/summary&gt;</p>
</details>
`));
