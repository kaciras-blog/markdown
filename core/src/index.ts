declare global {
	// Processed by Vite, see ../html-string.ts
	const $HTML: (..._: unknown[]) => string;
}

export * from "./directive.ts";
export * from "./miscellaneous.ts";

export { default as TOC } from "markdown-it-toc-done-right";
export { default as Collect } from "./collect.ts";
export { default as Media } from "./directive.ts";
export { default as Collapsible } from "./collapsible.ts";

export enum TextWrapper {
	None = 0,
	Italic = 1,
	Bold = 2,
	Code = 4,
	StrikeThrough = 8,
}

/**
 * 搜索一段文本所有的包装，包装是指两端具有对称字符的语法，如 **bold**, `code` 等等。
 *
 * @return [文本拥有的包装, 包装字符串的长度] 二元组。
 */
export function getWrappers(text: string): [TextWrapper, number] {
	let wrappers = TextWrapper.None;
	let i = 0;
	let k = text.length - 1;
	let repeat = 0;
	let prev = text.charCodeAt(0);

	if (k < 1) {
		return [TextWrapper.None, 0]; // 长度不足 2 的肯定没有包装。
	}

	// 通过前一个字符和它重复的次数来断包装的类型。
	function getWrapperType() {
		if (prev === 126 /* ~ */ && repeat === 2) {
			return TextWrapper.StrikeThrough;
		}
		if (prev === 96 /* ` */ && repeat > 0) {
			return TextWrapper.Code;
		}
		if (prev !== 42 /* * */ && prev !== 95 /* _ */) {
			return TextWrapper.None;
		}
		if (repeat === 1) {
			return TextWrapper.Italic;
		}
		if (repeat === 2) {
			return TextWrapper.Bold;
		}
		return TextWrapper.Bold | TextWrapper.Italic;
	}

	for (; i < k; i++, k--, repeat++) {
		const c = text.charCodeAt(i);
		if (c !== text.charCodeAt(k)) {
			break; // 前后对称位置的字符不一样。
		}
		if (c !== prev) {
			const w = getWrapperType();
			if (w === 0) {
				break;
			}
			repeat = 0;
			prev = c;
			wrappers |= w;
		}
	}

	// 如果前面字符串的不是有效的包装，则要把长度回退到最后一个包装。
	const w = getWrapperType();
	return [wrappers | w, w === TextWrapper.None ? i - repeat : i];
}
