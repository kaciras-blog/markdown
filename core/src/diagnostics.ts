import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.js";

/**
 * 给块语法渲染的结果中添加原文行号信息，这样就能定位哪一行渲染出了哪个元素。
 *
 * @see https://github.com/microsoft/vscode/blob/1f94e5cd54ce0a7bc503a3f95a3742ddc5980151/extensions/markdown-language-features/src/markdownEngine.ts#L22
 */
export function sourceLine(md: MarkdownIt) {
	md.core.ruler.push("source-line", state => {
		for (const token of state.tokens) {
			if (token.map && token.type !== "inline") {
				const [s, e] = token.map;
				token.attrSet("data-line", `${s},${e}`);
			}
		}
	});
}

/**
 * 检查文本中所有文件链接的插件，文件链接包括链接的 href，以及媒体的源。
 *
 * @param md 要安装到的 MarkdownIt 对象。
 * @param handler 找到的链接将传递给这个函数。
 */
export function collect(md: MarkdownIt, handler: (url: string) => void) {

	function check(tokens: Token[]) {
		for (const token of tokens) {
			switch (token.type) {
				case "inline":
					check(token.children!);
					break;
				case "link_open":
					handler(token.attrGet("href")!);
					break;
				case "image":
				case "directive":
					handler(token.attrGet("src")!);
					break;
			}
		}
	}

	md.core.ruler.push("collect-links", s => check(s.tokens));
}
