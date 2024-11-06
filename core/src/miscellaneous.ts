import MarkdownIt from "markdown-it";
import toc from "markdown-it-toc-done-right";
import AnchorRaw from "markdown-it-anchor";
import FootnoteRaw from "markdown-it-footnote";
import fence from "./web/fence.ts";
import highlight from "./web/highlight.ts";
import media from "./web/media.ts";
import directive from "./directive.ts";
import div from "./div.js";
import collapsible from "./collapsible.ts";

/**
 * 给所有链接加上 rel="ugc,nofollow" 防止刷外链，推荐用于渲染第三方输入。
 *
 * https://support.google.com/webmasters/answer/96569?hl=zh-Hans
 */
export function ugc(md: MarkdownIt) {
	const { renderer } = md;
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
 * 给标题加上锚点，是对 markdown-it-anchor 的简单封装，做了一些自定义：
 * - 链接元素放到了后面，让布局更容易。
 * - 可以设置 env.docId 参数来给链接加前缀，避免单页里多个文章的锚点重复。
 *
 * TODO: TOC 还不支持 docId，生成的锚点无法点击导航。
 */
export function anchor(md: MarkdownIt) {
	md.use<AnchorRaw.AnchorOptions>(AnchorRaw, {
		permalink: AnchorRaw.permalink.linkInsideHeader({
			placement: "after",
			class: "anchor-link",
		}),
		slugifyWithState(title, state) {
			const { docId } = state.env; // env 默认为空对象。
			title = title.trim().toLowerCase().replace(/\s+/g, "-");
			return docId ? `${docId}-${title}` : title;
		},
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
export function footnote(md: MarkdownIt) {
	md.use(FootnoteRaw);
	const { rules } = md.renderer;

	rules.footnote_block_open = () => (
		"<h2 class='footnotes'></h2>" +
		"<ol class='footnotes-list'>"
	);
	rules.footnote_block_close = () => "</ol>";
}

/**
 * 一些小的、通用的调整，为了方便加样式，因为每个都没几行所以放一起了。
 *
 * - 行内代码加个 inline-code 类以便跟代码块区分。
 * - 表格外层套上 div 这样就能加滚动条。
 */
export function styling(md: MarkdownIt) {
	const { rules } = md.renderer;
	const inlineRaw = rules.code_inline!;

	rules.table_open = () => '<div class="table-view"><table>';
	rules.table_close = () => "</table></div>";

	rules.code_inline = function (tokens, idx, ...rest) {
		const token = tokens[idx];
		token.attrPush(["class", "inline-code"]);
		return inlineRaw.call(this, tokens, idx, ...rest);
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
 * 一次性添加其他所有 KFM 插件的插件（不包括 diagnostics.ts 里的），用于一些常见情况。
 */
export function kfmPreset(md: MarkdownIt, options: PresetOptions = {}) {
	if (options.plain) {
		md.use(directive);
	} else {
		if (!options.guest) {
			md.use(anchor);
		}
		md.options.highlight ??= highlight;
		md.use(fence);
		md.use(media);
		md.use(styling);
	}

	if (options.guest) {
		md.use(ugc);
	} else {
		md.use(toc);
	}

	return md.use(div).use(footnote).use(collapsible);
}
