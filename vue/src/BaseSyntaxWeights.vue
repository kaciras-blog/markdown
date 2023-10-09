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

<script lang='ts'>
import { Emphasis, getEmphasis } from "@kaciras-blog/markdown";
import { Range, Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import { ICommand, IEditOperationBuilder, ITextModel } from "./addon-api.ts";

class EmphasisCommand implements ICommand {

	private readonly range: Selection;
	private readonly type: Emphasis;

	private deltaBegin!: number;
	private deltaEnd!: number;

	constructor(range: Selection, type: Emphasis) {
		this.type = type;
		this.range = range;
	}

	computeCursorState() {
		const { range, deltaBegin, deltaEnd } = this;
		if (!deltaEnd) {
			return range;
		}
		return new Selection(
			range.startLineNumber,
			range.startColumn,
			range.endLineNumber,
			range.endColumn + deltaEnd + deltaBegin,
		);
	}

	getEditOperations(model: ITextModel, builder: IEditOperationBuilder) {
		const { range, type } = this;

		for (const x of splitToLines(model, range)) {
			const text = model.getValueInRange(x);

			if (text.length === 0) {
				continue; // MD 语法简单，就不支持预先插入了，实现起来容易些。
			}

			const [emphasis, remove] = getEmphasis(text);
			const changed = emphasis ^ type;
			const strings = [];

			if ((changed & Emphasis.Bold) !== 0) {
				strings.push("**");
			}
			if ((changed & Emphasis.Italic) !== 0) {
				strings.push("*");
			}
			if ((changed & Emphasis.StrikeThrough) !== 0) {
				strings.push("~~");
			}
			if ((changed & Emphasis.Code) !== 0) {
				strings.push("`");
			}

			const prefix = strings.join("");
			const s = x.getStartPosition();
			const left = Range.fromPositions(s, s.delta(0, remove));
			builder.addEditOperation(left, prefix);

			const e = x.getEndPosition();
			const right = Range.fromPositions(e, e.delta(0, -remove));
			builder.addEditOperation(right, strings.reverse().join(""));

			this.deltaEnd = prefix.length - remove;
			if (!this.deltaBegin) {
				this.deltaBegin = this.deltaEnd;
			}
		}
	}
}

class PrefixCommand implements ICommand {

	private readonly range: Selection;
	private readonly prefix: string;

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

function* splitToLines(model: ITextModel, range: Range) {
	const { startLineNumber: s, endLineNumber: e } = range;
	if (e === s) {
		yield range;
		return;
	}
	yield new Range(s, range.startColumn, s, model.getLineLength(s) + 1);
	for (let i = s + 1; i < e; i++) {
		yield new Range(i, 1, i, model.getLineLength(i) + 1);
	}
	yield new Range(e, 1, e, range.endColumn);
}
</script>

<script setup lang='ts'>
import { IconBlockquote, IconBold, IconCode, IconItalic, IconStrikethrough } from "@tabler/icons-vue";
import ToolButton from "./ToolButton.vue";
import { useAddonContext } from "./addon-api.ts";

const context = useAddonContext();

function toggleEmphasis(type: Emphasis) {
	const command = new EmphasisCommand(context.selection.value, type);
	context.editor.focus();
	context.editor.executeCommand(null, command);
}

function addPrefix(prefix: string) {
	const command = new PrefixCommand(context.selection.value, prefix);
	context.editor.focus();
	context.editor.executeCommand(null, command);
}
</script>
