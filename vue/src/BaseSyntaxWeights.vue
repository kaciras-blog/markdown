<template>
	<ToolButton title='粗体' @click='toggleEmphasis(Emphasis.Bold)'>
		<BoldIcon/>
	</ToolButton>
	<ToolButton title='斜体' @click='toggleEmphasis(Emphasis.Italic)'>
		<ItalicIcon/>
	</ToolButton>
	<ToolButton title='删除线' @click='toggleEmphasis(Emphasis.StrikeThrough)'>
		<StrikethroughIcon/>
	</ToolButton>
	<ToolButton title='行内代码' @click='toggleEmphasis(Emphasis.Code)'>
		<CodeIcon/>
	</ToolButton>
	<ToolButton title='引用块' @click='addPrefix("> ")'>
		<QuoteIcon/>
	</ToolButton>
</template>

<script setup lang="ts">
import { editor, Range, Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import { Emphasis, getEmphasis } from "@kaciras-blog/markdown";
import BoldIcon from "@material-design-icons/svg/round/format_bold.svg?sfc";
import ItalicIcon from "@material-design-icons/svg/round/format_italic.svg?sfc";
import StrikethroughIcon from "@material-design-icons/svg/round/strikethrough_s.svg?sfc";
import QuoteIcon from "bootstrap-icons/icons/quote.svg?sfc";
import CodeIcon from "@material-design-icons/svg/round/code.svg?sfc";
import ToolButton from "./ToolButton.vue";
import { useAddonContext } from "./addon-api.ts";

const context = useAddonContext();

class EmphasisCommand implements editor.ICommand {

	readonly range: Selection;
	readonly emphasis: Emphasis;
	readonly remove: number;

	addCount = 0;

	constructor(range: Selection, emphasis: Emphasis, remove: number) {
		this.range = range;
		this.emphasis = emphasis;
		this.remove = remove;
	}

	computeCursorState(_: editor.ITextModel, __: editor.ICursorStateComputerData) {
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
		const { range, emphasis, remove } = this;
		const strings = [];

		if ((emphasis & Emphasis.Bold) !== 0) {
			strings.push("**");
		}
		if ((emphasis & Emphasis.Italic) !== 0) {
			strings.push("*");
		}
		if ((emphasis & Emphasis.StrikeThrough) !== 0) {
			strings.push("~~");
		}
		if ((emphasis & Emphasis.Code) !== 0) {
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

function toggleEmphasis(type: Emphasis) {
	const range = context.selection.value;
	const text = context.editor.getModel()!.getValueInRange(range);

	const [emphasis, length] = getEmphasis(text);
	const changed = emphasis ^ type;

	const command = new EmphasisCommand(range, changed, length);
	context.editor.focus();
	context.editor.executeCommand("md.emphasis", command);
}

class PrefixCommand implements editor.ICommand {

	readonly range: Selection;
	readonly prefix: string;

	constructor(range: Selection, prefix: string) {
		this.range = range;
		this.prefix = prefix;
	}

	computeCursorState(_: editor.ITextModel, __: editor.ICursorStateComputerData) {
		const { range, prefix } = this;
		return new Selection(
			range.startLineNumber,
			range.startColumn + prefix.length,
			range.endLineNumber,
			range.endColumn + prefix.length,
		);
	}

	getEditOperations(_: editor.ITextModel, builder: editor.IEditOperationBuilder) {
		const { range, prefix } = this;
		for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
			builder.addEditOperation(new Range(i, 0, i, 0), prefix);
		}
	}
}

function addPrefix(prefix: string) {
	const command = new PrefixCommand(context.selection.value, prefix);
	context.editor.focus();
	context.editor.executeCommand("md.prefix", command);
}
</script>
