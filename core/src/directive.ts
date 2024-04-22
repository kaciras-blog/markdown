/*
 * 指令语法，可用于插入视频、音频等，该语句是一个块级元素，因为目前没有混排的需求。
 *
 * 格式：@<type>[<label>](<href>){<attrs>}
 * - type: 指令类型
 * - label: 替代内容或标签
 * - href: 源链接
 * - attrs: 可选的附加属性，连带大括号构成 JSON 对象。
 *
 * Example:
 * @gif[A animated image](/data/gif-to-video.mp4?vw=300&vh=100)
 * @video[/poster.png](/foo/bar/mp4)
 *
 * 【语法相关讨论】
 * https://talk.commonmark.org/t/embedded-audio-and-video/441
 * https://talk.commonmark.org/t/generic-directives-plugins-syntax/444
 *
 * 【为什么不用 GitLab Flavored Markdown】
 * 复用图片的语法，依靠扩展名来区分媒体类型有两个缺陷：
 * - 无法解决用视频来模拟GIF图片的需求
 * - URL 必须要有扩展名，但并不是所有系统都是这样（比如 Twitter）
 *
 * https://gitlab.com/help/user/markdown#videos
 */
import StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import Token from "markdown-it/lib/token.mjs";
import Renderer from "markdown-it/lib/renderer.mjs";
import MarkdownIt from "markdown-it";
import { unescapeMd } from "markdown-it/lib/common/utils.mjs";

function parse(state: StateBlock, startLine: number, _: number, silent: boolean) {
	const offset = state.tShift[startLine] + state.bMarks[startLine];

	// JS 的傻逼正则不能设置结束位置，必须得截字符串。
	const src = state.src.slice(offset, state.eMarks[startLine]);

	let directive: GenericDirective;
	try {
		directive = parseGenericDirective(src);
	} catch (e) {
		return false;
	}

	if (!silent) {
		const { type, label, href, attrs } = directive;
		const token = state.push("directive", type, 0);
		token.meta = attrs;
		token.content = label;
		token.map = [startLine, startLine + 1];
		token.attrs = [["src", checkLink(state.md, href)]];
	}

	state.line = startLine + 1;
	return true;
}

export interface GenericDirective {
	type: string;
	label: string;
	href: string;
	attrs: Record<string, any>;
}

/**
 * 解析指令语法，从中提取出各个部分并处理转义，详解见：
 * https://blog.kaciras.com/article/18/add-video-support-to-markdown
 *
 * @param line 待解析的文本
 * @return 包含各个部分的对象
 * @throws 如果给定的文本不符合指令语法
 */
export function parseGenericDirective(line: string) {
	const match = /^@([a-z][a-z0-9\-_]*)/i.exec(line);
	if (!match) {
		throw new Error("Not a directive syntax.");
	}

	const [{ length }, type] = match;
	const labelEnd = readBracket(line, length, 0x5B, 0x5D);
	const hrefEnd = readBracket(line, labelEnd + 1, 0x28, 0x29);

	const label = unescapeMd(line.slice(length + 1, labelEnd));
	const href = unescapeMd(line.slice(labelEnd + 2, hrefEnd));

	const attrStart = hrefEnd + 1;
	let attrs = {};
	if (line.charCodeAt(attrStart) === 123 /* { */) {
		attrs = JSON.parse(line.slice(attrStart));
	} else if (attrStart !== line.length) {
		throw new Error("Extra strings after the directive.");
	}

	return { type, label, href, attrs } as GenericDirective;
}

/**
 * 解析左右分别是正反括号的内容，找到结束的位置，支持配对计数和斜杠转义。
 *
 * @param src 文本
 * @param i 起始位置
 * @param open 左括号的字符码
 * @param close 右括号字符码
 * @return 结束位置
 * @throws 如果给定的片段不符合语法
 */
function readBracket(src: string, i: number, open: number, close: number) {
	if (src.charCodeAt(i) !== open) {
		const expect = String.fromCharCode(open);
		const actual = src.charAt(i);
		throw new Error(`Expect ${expect}, but found ${actual}`);
	}

	let level = 1;
	while (++i < src.length) {
		switch (src.charCodeAt(i)) {
			case 0x5C: /* \ */
				++i;
				break;
			case open:
				level++;
				break;
			case close:
				level--;
				break;
		}
		if (level === 0) return i;
	}
	throw new Error(`Bracket count does not match, level=${level}`);
}

/**
 * 检查链接，处理 URL 转义和 XSS 攻击，如果有风险则返回空字符串。
 *
 * @param md MarkdownIt 的实例
 * @param link 需要检查的链接
 * @return 安全的链接，可以直接写进HTML
 */
function checkLink(md: MarkdownIt, link: string) {
	link = md.normalizeLink(link);
	return md.validateLink(link) ? link : "";
}

/**
 * 自定义渲染函数，以 type 作为键，值为渲染函数。
 * 其中 href 已经使用上面的 checkLink 对 XSS 做了检查。
 *
 * 【为何在渲染函数中检查链接】
 * 与传统的 Markdown 语法不同，通用指令旨在支持一系列的扩展功能，其几个片段的意义由指令决定，
 * 解析器只做提取，故只有在渲染函数中才能确定字段是不是链接。
 */
export interface DirectiveMap {

	/**
	 * 自定义指令的渲染，属性名对应指令，返回 HTML。
	 *
	 * @param this MarkdownIt 的渲染器。
	 * @param token 要渲染的 Token。
	 * @param md MarkdownIt 对象。
	 * @param env 用户自定义的对象。
	 */
	[type: string]: (this: Renderer, token: Token, md: MarkdownIt, env: any) => string;
}

/**
 * 默认的指令表，有 audio、video 和 gif 类型，简单地渲染为 <audio> 和 <video>
 */
export const defaultDirectiveMap: Readonly<DirectiveMap> = {

	audio(token: Token) {
		return `<audio${this.renderAttrs(token)} controls></audio>`;
	},

	video(token: Token, md: MarkdownIt) {
		const poster = md.normalizeLink(token.content);
		if (poster && md.validateLink(poster)) {
			token.attrs!.push(["poster", poster]);
		}
		return `<video${this.renderAttrs(token)} controls></video>`;
	},

	// 仍然加上 controls 避免无法播放
	gif(token: Token) {
		return `<video${this.renderAttrs(token)} loop muted controls></video>`;
	},
};

export default function (md: MarkdownIt, map = defaultDirectiveMap) {
	md.renderer.rules.directive = (tokens, idx, _, env, self) => {
		const token = tokens[idx];
		const renderFn = map[token.tag];
		if (!renderFn) {
			return `[Unknown directive: ${token.tag}]`;
		}
		return renderFn.call(self, token, md, env);
	};
	md.block.ruler.before("html_block", "directive", parse);
}
