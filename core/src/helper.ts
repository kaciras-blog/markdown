import MarkdownIt from "markdown-it";
import TOC from "markdown-it-toc-done-right";
import highlight from "./web/highlight.js";
import Fence from "./web/fence.js";
import Media from "./web/media.js";
import { Anchor, Classify, Footnote, UGC } from "./miscellaneous.js";
import Directive from "./directive.js";
import Collapsible from "./collapsible.js";

export enum Emphasis {
	None = 0,
	Italic = 1,
	Bold = 2,
	Code = 4,
	StrikeThrough = 8,
}

/**
 * 搜索一段文本所有的强调，强调是指两端具有对称字符的语法，如 **bold**, `code` 等等。
 *
 * @return [强调类型, 强调字符串的长度（一侧）] 二元组。
 */
export function getEmphasis(text: string): [Emphasis, number] {
	let emphasis = Emphasis.None;
	let i = 0;
	let k = text.length - 1;
	let repeat = 0;
	let prev = text.charCodeAt(0);

	if (k < 1) {
		return [Emphasis.None, 0]; // 长度不足 2 的肯定没有强调。
	}

	// 通过前一个字符 prev 和它重复的次数 repeat 来判断强调的类型。
	function check(): Emphasis {
		if (repeat === 0) {
			return Emphasis.None;
		}
		if (prev === 126 /* ~ */ && repeat === 2) {
			return Emphasis.StrikeThrough;
		}
		if (prev === 96 /* ` */) {
			return Emphasis.Code;
		}
		if (prev !== 42 /* * */ && prev !== 95 /* _ */) {
			return Emphasis.None;
		}
		if (repeat === 1) {
			return Emphasis.Italic;
		}
		if (repeat === 2) {
			return Emphasis.Bold;
		}
		return Emphasis.Bold | Emphasis.Italic;
	}

	for (; i < k; i++, k--, repeat++) {
		const c = text.charCodeAt(i);
		if (c !== text.charCodeAt(k)) {
			break; // 前后对称位置的字符不一样。
		}
		if (c !== prev) {
			const w = check();
			if (w === 0) {
				break;
			}
			repeat = 0;
			prev = c;
			emphasis |= w;
		}
	}

	// 如果前面字符串的不是有效的强调，则要把长度回退到最后一个。
	const w = check();
	return [emphasis | w, w === Emphasis.None ? i - repeat : i];
}

export interface PresetOptions {

	/**
	 * 如果为 true 则仅添加语法类插件，渲染的结果只有必要的标签，
	 * 用于给第三方阅读器使用（RSS,阅读模式……）。
	 *
	 * 反之则渲染出更丰富且有交互能力的 HTML，需要搭配样式表和激活。
	 */
	plain?: boolean;

	/**
	 * 如果为 true 则移除一些用于长文的插件，并加入 UGC 防刷外链，
	 * 适用于用户评论等第三方输入。
	 */
	guest?: boolean;
}

/**
 * 一次性添加其他所有 KFM 插件的插件，用于一些常见情况。
 */
export function kfmPreset(markdownIt: MarkdownIt, options: PresetOptions) {
	if (options.plain) {
		markdownIt.use(Directive);
	} else {
		if (!options.guest) {
			markdownIt.use(Anchor);
		}
		markdownIt.use(Fence, highlight);
		markdownIt.use(Media);
		markdownIt.use(Classify);
	}

	if (options.guest) {
		markdownIt.use(UGC);
	} else {
		markdownIt.use(TOC);
	}

	return markdownIt.use(Footnote).use(Collapsible);
}
