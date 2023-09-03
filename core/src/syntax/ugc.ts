import MarkdownIt from "markdown-it";

/**
 * 处理第三方用户输入的 MarkdownIt 插件，用于防止刷外链。
 *
 * 用户的输入的链接必须加个 rel="ugc,nofollow" 防止滥用。
 * https://support.google.com/webmasters/answer/96569?hl=zh-Hans
 *
 * @param markdownIt 要安装的实例
 */
export default function (markdownIt: MarkdownIt) {
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
