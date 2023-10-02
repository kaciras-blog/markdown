import { expect, it } from "vitest";
import { Emphasis, getEmphasis } from "../src/index.ts";

const cases: Array<[string, number, Emphasis]> = [
	["text", 0, Emphasis.None],
	["t+exe+t", 0, Emphasis.None],
	["", 0, Emphasis.None],
	["*", 0, Emphasis.None],
	["**AB", 0, Emphasis.None],

	["~text~", 0, Emphasis.None],
	["~~text~~", 2, Emphasis.StrikeThrough],
	["~~~~", 2, Emphasis.StrikeThrough],

	// 三个以上的 ~ 是栅栏代码块。
	["~~~text~~~", 0, Emphasis.None],
	["~~~~text~~~~", 0, Emphasis.None],

	["_text_", 1, Emphasis.Italic],
	["*text*", 1, Emphasis.Italic],
	["**", 1, Emphasis.Italic],
	["***", 1, Emphasis.Italic],
	["_*text*_", 2, Emphasis.Italic],
	["*_text_*", 2, Emphasis.Italic],
	["_*_text_*_", 3, Emphasis.Italic],

	["__text__", 2, Emphasis.Bold],
	["**text**", 2, Emphasis.Bold],

	["___text___", 3, Emphasis.Bold | Emphasis.Italic],
	["***text***", 3, Emphasis.Bold | Emphasis.Italic],
	["_____text_____", 5, Emphasis.Bold | Emphasis.Italic],

	["`text`", 1, Emphasis.Code],
	["``text``", 2, Emphasis.Code],

	// 三个以上的 ` 也可以是代码块，但 MarkdownIt 优先判定成行内代码。
	["```text```", 3, Emphasis.Code],
	["````text````", 4, Emphasis.Code],

	["**_text_**", 3, Emphasis.Bold | Emphasis.Italic],
	["**__text__**", 4, Emphasis.Bold],
	["***__text__***", 5, Emphasis.Bold | Emphasis.Italic],

	["`~~*text*~~`", 4, Emphasis.Code | Emphasis.Italic | Emphasis.StrikeThrough],

	[
		"`~~___text___~~`", 6,
		Emphasis.Code | Emphasis.Italic | Emphasis.StrikeThrough | Emphasis.Bold,
	],
];

it.each(cases)("should works for %s", (text, length, type) => {
	expect(getEmphasis(text)).toStrictEqual([type, length]);
});
