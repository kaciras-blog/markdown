import StateBlock from "markdown-it/lib/rules_block/state_block.js";
import MarkdownIt from "markdown-it";

function isWholeLine(state: StateBlock, lineNum: number, text: string) {
	const { src, bMarks, tShift, eMarks } = state;
	const i = bMarks[lineNum] + tShift[lineNum];
	const k = eMarks[lineNum];
	return i + text.length === k && src.startsWith(text, i);
}

function parse(state: StateBlock, startLine: number, endLine: number) {
	if (!isWholeLine(state, startLine, "<details>")) {
		return false; // MarkdownIt 的匹配总是从当前行开始，不要往下搜索。
	}

	let line = startLine + 1;
	let nestingLevel = 1;
	for (; line < endLine && nestingLevel > 0; line++) {
		if (isWholeLine(state, line, "<details>")) {
			nestingLevel += 1;
		} else if (isWholeLine(state, line, "</details>")) {
			nestingLevel -= 1;
		}
	}

	if (nestingLevel !== 0) {
		return false; // Markdown 不完整，为了安全性不要输出半开标签，即使浏览器也能处理。
	}

	const oldParent = state.parentType;
	const oldLineMax = state.lineMax;
	(state.parentType as string) = "collapsible";
	state.lineMax = line - 1;

	let token = state.push("collapsible_open", "details", 1);
	token.block = true;
	token.markup = "<details>";
	token.map = [startLine, startLine + 1];

	state.md.block.tokenize(state, startLine + 1, line - 1);

	token = state.push("collapsible_close", "details", -1);
	token.block = true;
	token.markup = "</details>";

	state.parentType = oldParent;
	state.lineMax = oldLineMax;

	state.line = line;
	return true;
}

// 先仅支持在 summary 里写行内语法，如果由需求再看看要不要支持全部。
function parseSummary(state: StateBlock, startLine: number, endLine: number) {
	const { src, bMarks, eMarks } = state;

	if (!isWholeLine(state, startLine, "<summary>")) {
		return false; // MarkdownIt 的匹配总是从当前行开始，不要往下搜索。
	}
	if (state.tokens.at(-1)?.type !== "collapsible_open") {
		return false; // 限制 <summary> 必须紧跟 <details>，避免写法太多以后修改困难。
	}

	let line = (startLine += 1);
	for (; line < endLine; line++) {
		if (isWholeLine(state, line, "</summary>")) break;
	}

	state.push("summary_open", "summary", 1);
	const token = state.push("inline", "", 0);
	token.children = [];
	token.content = src.slice(bMarks[startLine], eMarks[line - 1]);
	state.push("summary_close", "summary", -1);

	state.line = line + 1;
	return true;
}

export default function (markdownIt: MarkdownIt) {
	markdownIt.block.ruler.before("fence", "collapsible", parse);
	markdownIt.block.ruler.before("fence", "summary", parseSummary);
}
