<template>
	<ToolButton title='粗体' @click='toggleEmphasis(Emphasis.Bold)'>
		<IconBold/>
	</ToolButton>
	<ToolButton title='斜体' @click='toggleEmphasis(Emphasis.Italic)'>
		<IconItalic/>
	</ToolButton>
	<ToolButton title='删除线' @click='toggleEmphasis(Emphasis.StrikeThrough)'>
		<IconStrikethrough/>
	</ToolButton>
	<ToolButton title='行内代码' @click='toggleEmphasis(Emphasis.Code)'>
		<IconCode/>
	</ToolButton>

	<ToolButton title='引用块' @click='addPrefix("> ")'>
		<IconBlockquote/>
	</ToolButton>
</template>

<script lang="ts">
import { Emphasis, getEmphasis } from "@kaciras-blog/markdown";
import { Range, Selection } from "monaco-editor";
import { ICommand, IEditOperationBuilder, ITextModel } from "./addon-api.ts";

class EmphasisCommand implements ICommand {

	readonly range: Selection;
	readonly emphasis: Emphasis;
	readonly remove: number;

	addCount = 0;

	constructor(range: Selection, emphasis: Emphasis, remove: number) {
		this.range = range;
		this.emphasis = emphasis;
		this.remove = remove;
	}

	computeCursorState() {
		const { range, addCount, remove } = this;
		const delta = addCount - remove;
		return new Selection(
			range.startLineNumber,
			range.startColumn,
			range.endLineNumber,
			range.endColumn + delta + delta,
		);
	}

	getEditOperations(_: ITextModel, builder: IEditOperationBuilder) {
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

class PrefixCommand implements ICommand {

	readonly range: Selection;
	readonly prefix: string;

	constructor(range: Selection, prefix: string) {
		this.range = range;
		this.prefix = prefix;
	}

	computeCursorState() {
		const { range, prefix } = this;
		return new Selection(
			range.startLineNumber,
			range.startColumn + prefix.length,
			range.endLineNumber,
			range.endColumn + prefix.length,
		);
	}

	getEditOperations(_: ITextModel, builder: IEditOperationBuilder) {
		const { range, prefix } = this;
		for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
			builder.addEditOperation(new Range(i, 0, i, 0), prefix);
		}
	}
}
</script>

<script setup lang="ts">
import { IconBlockquote, IconBold, IconCode, IconItalic, IconStrikethrough } from "@tabler/icons-vue";
import ToolButton from "./ToolButton.vue";
import { useAddonContext } from "./addon-api.ts";

const context = useAddonContext();

function toggleEmphasis(type: Emphasis) {
	const range = context.selection.value;
	const text = context.editor.getModel()!.getValueInRange(range);

	const [emphasis, length] = getEmphasis(text);
	const changed = emphasis ^ type;

	const command = new EmphasisCommand(range, changed, length);
	context.editor.focus();
	context.editor.executeCommand("md.emphasis", command);
}

function addPrefix(prefix: string) {
	const command = new PrefixCommand(context.selection.value, prefix);
	context.editor.focus();
	context.editor.executeCommand("md.prefix", command);
}
</script>
