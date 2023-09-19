import { expect, it } from "vitest";
import { getWrappers, TextWrapper } from "../src/index.ts";

const cases: Array<[string, number, TextWrapper]> = [
	["text", 0, TextWrapper.None],
	["t+exe+t", 0, TextWrapper.None],
	["", 0, TextWrapper.None],
	["*", 0, TextWrapper.None],

	["~text~", 0, TextWrapper.None],
	["~~text~~", 2, TextWrapper.StrikeThrough],
	["~~~~", 2, TextWrapper.StrikeThrough],

	// 三个以上的 ~ 是栅栏代码块。
	["~~~text~~~", 0, TextWrapper.None],
	["~~~~text~~~~", 0, TextWrapper.None],

	["_text_", 1, TextWrapper.Italic],
	["*text*", 1, TextWrapper.Italic],
	["**", 1, TextWrapper.Italic],
	["***", 1, TextWrapper.Italic],
	["_*text*_", 2, TextWrapper.Italic],
	["*_text_*", 2, TextWrapper.Italic],
	["_*_text_*_", 3, TextWrapper.Italic],

	["__text__", 2, TextWrapper.Bold],
	["**text**", 2, TextWrapper.Bold],

	["___text___", 3, TextWrapper.Bold | TextWrapper.Italic],
	["***text***", 3, TextWrapper.Bold | TextWrapper.Italic],
	["_____text_____", 5, TextWrapper.Bold | TextWrapper.Italic],

	["`text`", 1, TextWrapper.Code],
	["``text``", 2, TextWrapper.Code],

	// 三个以上的 ` 也可以是代码块，但 MarkdownIt 优先判定成行内代码。
	["```text```", 3, TextWrapper.Code],
	["````text````", 4, TextWrapper.Code],

	["**_text_**", 3, TextWrapper.Bold | TextWrapper.Italic],
	["**__text__**", 4, TextWrapper.Bold],
	["***__text__***", 5, TextWrapper.Bold | TextWrapper.Italic],

	["`~~*text*~~`", 4, TextWrapper.Code | TextWrapper.Italic | TextWrapper.StrikeThrough],

	[
		"`~~___text___~~`", 6,
		TextWrapper.Code | TextWrapper.Italic | TextWrapper.StrikeThrough | TextWrapper.Bold,
	],
];

it.each(cases)("should works for %s", (text, length, type) => {
	expect(getWrappers(text)).toStrictEqual([type, length]);
});
