import StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import MarkdownIt from "markdown-it";
import { isWholeLine, parseChildren } from "./collapsible.ts";

function parse(state: StateBlock, startLine: number, endLine: number) {
	const { src, bMarks, tShift, eMarks } = state;
	const offset = tShift[startLine] + bMarks[startLine];

	if (!src.startsWith("::: ", offset)) {
		return false;
	}

	const clazz = state.src.slice(offset + 4, eMarks[startLine]);
	if (!clazz) {
		return false;
	}

	let line = startLine + 1;
	let nestingLevel = 1;
	for (; line < endLine && nestingLevel > 0; line++) {
		const i = bMarks[line] + tShift[line];
		const e = eMarks[line];
		if (src.startsWith("::: ", i) && i + 4 !== e) {
			nestingLevel += 1;
		} else if (isWholeLine(state, line, ":::")) {
			nestingLevel -= 1;
		}
	}

	if (nestingLevel !== 0) {
		return false; // Markdown 不完整，为了安全性不要输出半开标签，即使浏览器也能处理。
	}

	let token = state.push("div_open", "div", 1);
	token.attrSet("class", `alert ${clazz}`);
	token.block = true;
	token.markup = "<div>";
	token.map = [startLine, line];

	parseChildren(state, startLine + 1, line - 1, "div");

	token = state.push("div_close", "div", -1);
	token.block = true;
	token.markup = "</div>";

	state.line = line;
	return true;
}

/**
 * 自定义容器块的支持，语法与 Djot 保持一致而不是采用 GitHub 的引用块写法。
 *
 * # 为什么不用 markdown-it-container
 * 它的判定太严了，只有加入白名单的才解析，而 Div 语法在 Djot 里是不限制 class 的。
 *
 * @see https://github.com/markdown-it/markdown-it-container
 */
export default function (md: MarkdownIt) {
	md.block.ruler.before("fence", "div", parse);
}
