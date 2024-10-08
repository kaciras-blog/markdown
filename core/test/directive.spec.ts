import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";
import directive, { DirectiveMap } from "../src/directive.ts";
import dedent from "dedent";

describe("tokenizer", () => {
	let token: Token | null = null;
	const markdownIt = new MarkdownIt();
	markdownIt.use(directive);

	markdownIt.renderer.rules.directive = (t, i) => {
		token = t[i];
		return "No render result for tokenizer test";
	};

	function parse(text: string) {
		token = null;
		markdownIt.render(text);
	}

	it("should parse type, label, src, and attrs", () => {
		parse('@gif[A gif video](/video/foo.mp4){ "vw":32, "vh":16 }');

		expect(token!.tag).toBe("gif");
		expect(token!.content).toBe("A gif video");
		expect(token!.attrGet("src")).toBe("/video/foo.mp4");
		expect(token!.meta).toStrictEqual({ vw: 32, vh: 16 });
	});

	it("should allow empty label and src", () => {
		parse("@gif[]()");

		expect(token!.content).toBe("");
		expect(token!.attrGet("src")).toBe("");
		expect(token!.meta).toStrictEqual({});
	});

	it.each([
		"@gif(/video/foobar.mp4)",
		"@gif[A gif video()",
		"@gif[](/video/foobar",
		"@gif[]",
		"@",
		"@gif",
	])("should ignore truncated text %#", (text) => {
		parse(text);
		expect(token).toBeNull();
	});

	it.each([
		"@gif[]() text after",
		"@gif[](){} text after",
		"xxx @gif[]()",
	])("should restrict statement is filled with a whole line %#", (text) => {
		parse(text);
		expect(token).toBeNull();
	});
});

describe("escaping", () => {
	let token: Token;

	const markdownIt = new MarkdownIt();
	markdownIt.use(directive);

	markdownIt.renderer.rules.directive = (t, i) => {
		token = t[i];
		return "No render result for tokenizer test";
	};

	it("should support escape \\]", () => {
		markdownIt.render("@gif[A \\[gif\\] video](/video/foobar.mp4)");
		expect(token.content).toBe("A [gif] video");
		expect(token.attrGet("src")).toBe("/video/foobar.mp4");
	});

	it("should support escape \\)", () => {
		markdownIt.render("@gif[](/video/foo\\)bar.mp4)");
		expect(token.attrGet("src")).toBe("/video/foo)bar.mp4");
	});

	it("should support bracket counting in label", () => {
		markdownIt.render("@gif[A [gif] video](/video/foobar.mp4)");
		expect(token.content).toBe("A [gif] video");
		expect(token.attrGet("src")).toBe("/video/foobar.mp4");
	});

	it("should support bracket counting in src", () => {
		markdownIt.render("@gif[](/video/foo(bar).mp4)");
		expect(token.attrGet("src")).toBe("/video/foo(bar).mp4");
	});

	it("should escape attributes", () => {
		markdownIt.render("@gif[](/video\\\\foobar.mp4)");
		expect(token.attrGet("src")).toBe("/video%5Cfoobar.mp4");
	});
});

describe("default renderer", () => {
	const markdownIt = new MarkdownIt();
	markdownIt.use(directive);

	it("should cooperate with others", () => {
		const markdown = dedent`
			text before
			
			@gif[A gif video](/video/foo.mp4)
			
			text after
		`;
		expect(markdownIt.render(markdown)).toMatchSnapshot();
	});

	it("should render audio", () => {
		expect(markdownIt.render("@audio[unused](/audio/music.flac)")).toMatchSnapshot();
	});

	it("should render gif video", () => {
		expect(markdownIt.render("@gif[A gif video](https://example.com/video/foo.mp4)")).toMatchSnapshot();
	});

	it("should render video", () => {
		expect(markdownIt.render("@video[/poster.png](/video/foo.mp4)")).toMatchSnapshot();
	});

	it("should not escape html for src", () => {
		expect(markdownIt.render('@video[/f"o"o](/bar?a=b&c=d)')).toMatchSnapshot();
	});

	it("should render unknown type", () => {
		expect(markdownIt.render("@unknown[]()")).toMatchSnapshot();
	});

	// 因为我用的 MarkdownIt 自带的 normalizeLink & validateLink，所以只测一种形式避免忘记检查
	it("should avoid XSS attack", () => {
		expect(markdownIt.render("@gif[](javascript:alert(1))")).toMatchSnapshot();
		expect(markdownIt.render("@gif[<script>alert(1)</script>]()")).toMatchSnapshot();
		expect(markdownIt.render("@audio[](javascript:alert(1))")).toMatchSnapshot();
		expect(markdownIt.render("@video[javascript:alert(1)]()")).toMatchSnapshot();
	});
});

it("should support render custom type", () => {
	const markdownIt = new MarkdownIt();

	markdownIt.use<DirectiveMap>(directive, {
		CUSTOM: (token) => `Custom [src=${token.attrGet("src")}, label=${token.content}]`,
	});

	const result = markdownIt.render("@CUSTOM[bar](foo)");
	expect(result).toBe("Custom [src=foo, label=bar]");
});
