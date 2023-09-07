import Token from "markdown-it/lib/token.js";
import MarkdownIt from "markdown-it";

/**
 * 检查文本中所有文件链接的插件，文件链接包括链接的 href，以及媒体的源。
 *
 * @param markdownIt 要安装到的 MarkdownIt 对象。
 * @param handler 找到的链接将传递给这个函数。
 */
export default function (markdownIt: MarkdownIt, handler: (url: string) => void) {

	function check(tokens: Token[]) {
		for (const token of tokens) {
			switch (token.type) {
				case "inline":
					check(token.children!);
					break;
				case "link_open":
				case "directive":
					handler(token.attrGet("href")!);
					break;
				case "image":
					handler(token.attrGet("src")!);
					break;
			}
		}
	}

	markdownIt.core.ruler.push("collect-links", s => check(s.tokens));
}
