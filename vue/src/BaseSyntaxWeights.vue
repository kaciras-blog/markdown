<template>
	<ToolButton type='icon' title='粗体' @click='switchWrapper(TextWrapper.Bold)'>
		<BoldIcon/>
	</ToolButton>
	<ToolButton type='icon' title='斜体' @click='switchWrapper(TextWrapper.Italic)'>
		<ItalicIcon/>
	</ToolButton>
	<ToolButton type='icon' title='删除线' @click='switchWrapper(TextWrapper.StrikeThrough)'>
		<StrikethroughIcon/>
	</ToolButton>
	<ToolButton type='icon' title='行内代码' @click='switchWrapper(TextWrapper.Code)'>
		<CodeIcon/>
	</ToolButton>
	<ToolButton type='icon' title='引用块' @click='addPrefixToLines(">")'>
		<QuoteIcon/>
	</ToolButton>
</template>

<script setup lang="ts">
import { editor, Range, Selection } from "monaco-editor/esm/vs/editor/editor.api";
import BoldIcon from "@material-design-icons/svg/round/format_bold.svg?sfc";
import ItalicIcon from "@material-design-icons/svg/round/format_italic.svg?sfc";
import StrikethroughIcon from "@material-design-icons/svg/round/strikethrough_s.svg?sfc";
import QuoteIcon from "bootstrap-icons/icons/quote.svg?sfc";
import CodeIcon from "@material-design-icons/svg/round/code.svg?sfc";
import ToolButton from "./ToolButton.vue";
import { useAddonContext } from "./addon-api.ts";
import { getWrappers, TextWrapper } from "@kaciras/markdown-core/src/index.ts";

const context = useAddonContext();

class WarpCommand implements editor.ICommand {

	readonly range: Selection;
	readonly wrappers: TextWrapper;
	readonly remove: number;

	addCount = 0;

	constructor(range: Selection, wrappers: TextWrapper, remove: number) {
		this.range = range;
		this.wrappers = wrappers;
		this.remove = remove;
	}

	computeCursorState(model: editor.ITextModel, helper: editor.ICursorStateComputerData) {
		const { range, addCount, remove } = this;
		const delta = addCount - remove;
		return new Selection(
			range.startLineNumber,
			range.startColumn,
			range.endLineNumber,
			range.endColumn + delta + delta,
		);
	}

	getEditOperations(_: editor.ITextModel, builder: editor.IEditOperationBuilder) {
		const { range, wrappers, remove } = this;
		const strings = [];

		if ((wrappers & TextWrapper.Bold) !== 0) {
			strings.push("**");
		}
		if ((wrappers & TextWrapper.Italic) !== 0) {
			strings.push("*");
		}
		if ((wrappers & TextWrapper.StrikeThrough) !== 0) {
			strings.push("~~");
		}
		if ((wrappers & TextWrapper.Code) !== 0) {
			strings.push("`");
		}

		const asc = strings.join("");
		this.addCount = asc.length;

		const s = range.getStartPosition();
		const left = Range.fromPositions(s, s.delta(0, remove));
		builder.addEditOperation(left, asc);

		const e = range.getEndPosition();
		const right = Range.fromPositions(e, e.delta(0, -remove));
		builder.addEditOperation(right, strings.reverse().join(""));
	}
}

function switchWrapper(type: TextWrapper) {
	const range = context.selection.value;
	const text = context.model.value.getValueInRange(range);

	const [wrappers, length] = getWrappers(text);
	const changed = wrappers ^ type;

	const command = new WarpCommand(range, changed, length);
	context.editor.executeCommand("MD.Wrap", command);
	context.editor.focus();
}

function addPrefixToLines(prefix: string) {
	const [selStart, selEnd] = getSelectedRange(true);
	const lines = context.content.substring(selStart, selEnd).split("\n");

	let text = "";
	for (let line of lines) {
		text += "\n";
		if (/^\s*$/.test(line)) {
			text += line;
		} else {
			text += prefix + line;
		}
	}
	text = text.substring(1);
	context.editor.executeCommand("MD.Prefix", command);
}
</script>
