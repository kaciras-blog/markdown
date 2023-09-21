import MarkdownIt from "markdown-it";
import AnchorRaw from "markdown-it-anchor";
import FootnoteRaw from "markdown-it-footnote";

/**
 * 处理第三方用户输入的 MarkdownIt 插件，用于防止刷外链。
 *
 * 用户的输入的链接必须加个 rel="ugc,nofollow" 防止滥用。
 * https://support.google.com/webmasters/answer/96569?hl=zh-Hans
 *
 * @param markdownIt 要安装的实例
 */
export function UGC(markdownIt: MarkdownIt) {
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
export function Anchor(markdownIt: MarkdownIt) {
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
export function Footnote(markdownIt: MarkdownIt) {
	markdownIt.use(FootnoteRaw);
	const { rules } = markdownIt.renderer;

	rules.footnote_block_open = () => (
		"<h2 class='footnotes'></h2>" +
		"<ol class='footnotes-list'>"
	);
	rules.footnote_block_close = () => "</ol>";
}

/**
 * 给行内代码加个 inline-code 类以便跟代码块区别开。
 */
export function Classify(markdownIt: MarkdownIt) {
	const { rules } = markdownIt.renderer;
	const raw = rules.code_inline!;

	rules.code_inline = (tokens, idx, options, env, self) => {
		const token = tokens[idx];
		token.attrPush(["class", "inline-code"]);
		return raw(tokens, idx, options, env, self);
	};
}
