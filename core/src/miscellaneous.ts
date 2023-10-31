import MarkdownIt from "markdown-it";
import toc from "markdown-it-toc-done-right";
import AnchorRaw from "markdown-it-anchor";
import FootnoteRaw from "markdown-it-footnote";
import fence from "./web/fence.ts";
import highlight from "./web/highlight.ts";
import media from "./web/media.ts";
import directive from "./directive.ts";
import collapsible from "./collapsible.ts";

/**
 * 给所有链接加上 rel="ugc,nofollow" 防止刷外链，推荐用于渲染第三方输入。
 *
 * https://support.google.com/webmasters/answer/96569?hl=zh-Hans
 */
export function ugc(markdownIt: MarkdownIt) {
	const { renderer } = markdownIt;
	const raw = renderer.renderToken;

	renderer.renderToken = function (tokens, idx, options) {
		const token = tokens[idx];
		if (token.type === "link_open") {
			token.attrPush(["rel", "ugc,nofollow"]);
		}
		return raw.call(this, tokens, idx, options);
	};
}

/**
 * 给标题加上锚点，是对 markdown-it-anchor 的简单封装。
 */
export function anchor(markdownIt: MarkdownIt) {
	markdownIt.use<AnchorRaw.AnchorOptions>(AnchorRaw, {
		permalink: AnchorRaw.permalink.linkInsideHeader({
			placement: "after",
			class: "anchor-link",
		}),
		slugify: title => title.trim().toLowerCase().replace(/\s+/g, "-"),
	});
}

/**
 * 在文章的末尾添加一段显示所有脚注。因为可能用于评论，所以修改渲染函数去掉横线，
 * 避免跟评论间的分隔混淆。
 *
 * 脚注段落有一个标题，其内容由 CSS 设置，你可以自己做本地化。
 * ```css
 * .footnotes:lang(zh)::before { content: "参考"; }
 * ```
 *
 * 可以通过 md.render 的第二个参数中添加 docId 来给锚点添加前缀，避免冲突。
 *
 * @see https://www.markdownguide.org/extended-syntax/#footnotes
 */
export function footnote(markdownIt: MarkdownIt) {
	markdownIt.use(FootnoteRaw);
	const { rules } = markdownIt.renderer;

	rules.footnote_block_open = () => (
		"<h2 class='footnotes'></h2>" +
		"<ol class='footnotes-list'>"
	);
	rules.footnote_block_close = () => "</ol>";
}

/**
 * 给行内代码加个 inline-code 类以便跟代码块区分。
 */
export function classify(markdownIt: MarkdownIt) {
	const { rules } = markdownIt.renderer;
	const raw = rules.code_inline!;

	rules.code_inline = (tokens, idx, options, env, self) => {
		const token = tokens[idx];
		token.attrPush(["class", "inline-code"]);
		return raw(tokens, idx, options, env, self);
	};
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
export function kfmPreset(markdownIt: MarkdownIt, options: PresetOptions = {}) {
	if (options.plain) {
		markdownIt.use(directive);
	} else {
		if (!options.guest) {
			markdownIt.use(anchor);
		}
		markdownIt.options.highlight ??= highlight;
		markdownIt.use(fence);
		markdownIt.use(media);
		markdownIt.use(classify);
	}

	if (options.guest) {
		markdownIt.use(ugc);
	} else {
		markdownIt.use(toc);
	}

	return markdownIt.use(footnote).use(collapsible);
}
