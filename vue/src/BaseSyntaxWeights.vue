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
import { ICommand, ICursorStateComputerData, IEditOperationBuilder, ITextModel } from "./addon-api.ts";

/**
 * 将选区按行分割成多个，如果原选区只有一行则原样返回。
 */
function* splitToLines(range: Range) {
	const { startLineNumber: s, endLineNumber: e } = range;
	if (e === s) {
		yield range;
		return;
	}
	yield new Range(s, range.startColumn, s, Infinity);
	for (let i = s + 1; i < e; i++) {
		yield new Range(i, 1, i, Infinity);
	}
	yield new Range(e, 1, e, range.endColumn);
}

/*
 * 因为强调的语法简单，就不支持纯插入了，这样可以跳过一些边界情况，实现起来更容易。
 * 纯插入指的是没有选择任何内容时，在光标的两侧插入语法符号，用于未来的输入。
 */
class EmphasisCommand implements ICommand {

	private readonly range: Selection;
	private readonly type: Emphasis;

	constructor(selection: Selection, type: Emphasis) {
		this.range = selection;
		this.type = type;
	}

	computeCursorState(_: any, helper: ICursorStateComputerData) {
		const { range } = this;
		const ops = helper.getInverseEditOperations();

		if (ops.length === 0) {
			return range;
		}
		return new Selection(
			range.startLineNumber,
			ops[0].range.startColumn,
			range.endLineNumber,
			ops.at(-1)!.range.endColumn,
		);
	}

	getEditOperations(model: ITextModel, builder: IEditOperationBuilder) {
		for (const x of splitToLines(this.range)) {
			const text = model.getValueInRange(x);

			if (text.length === 0) {
				continue;
			}
			const replacement = this.renovate(text);
			builder.addTrackedEditOperation(x, replacement);
		}
	}

	/**
	 * 切换文本两端指定类型（this.type）的强调符号，返回新的文本。
	 *
	 * # 实现方式
	 * 最初仅替换两端的符号部分，在同一行有多个选区时难以计算光标的位置。
	 * 现在改为的整个替换，这样能够使用 monaco-editor 内部的计算功能，
	 * 通过 InverseEditOperations 直接获取新的选区。
	 *
	 * @example
	 * this.type = Emphasis.Code;
	 * this.renovate("**Text**") // -> `Text`
	 */
	private renovate(text: string) {
		const [emphasis, remove] = getEmphasis(text);
		const changed = emphasis ^ this.type;
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
		const suffix = strings.reverse().join("");

		text = text.slice(remove, text.length - remove);
		return `${prefix}${text}${suffix}`;
	}
}

class PrefixCommand implements ICommand {

	private readonly range: Selection;
	private readonly prefix: string;

	overlap = false;

	constructor(selection: Selection, prefix: string) {
		this.range = selection;
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
		const { range, prefix, overlap } = this;
		let i = range.startLineNumber;
		if (overlap) {
			i += 1; // 第一行跟其它选区重了，跳过。
		}
		for (; i <= range.endLineNumber; i++) {
			builder.addEditOperation(new Range(i, 0, i, 0), prefix);
		}
	}
}
</script>

<script setup lang='ts'>
import { IconBlockquote, IconBold, IconCode, IconItalic, IconStrikethrough } from "@tabler/icons-vue";
import ToolButton from "./ToolButton.vue";
import { useAddonContext } from "./addon-api.ts";

const context = useAddonContext();

function toggleEmphasis(type: Emphasis) {
	const { editor } = context;
	const commands = editor.getSelections()!
		.map(s => new EmphasisCommand(s, type));
	editor.focus();
	editor.executeCommands(null, commands);
}

function addPrefix(prefix: string) {
	const { editor } = context;
	const selections = editor.getSelections()!;

	selections.sort(Range.compareRangesUsingStarts);
	const commands = selections.map(s => new PrefixCommand(s, prefix));

	// 检查两个选区是否都包含了同一行，有则给后一个添加 overlap 标记。
	for (let i = 1; i < selections.length; i++) {
		const prev = selections[i - 1];
		const curr = selections[i];
		commands[i].overlap = curr.startLineNumber === prev.endLineNumber;
	}

	editor.focus();
	editor.executeCommands(null, commands);
}
</script>
