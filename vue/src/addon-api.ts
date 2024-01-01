import { inject, provide, Ref, ShallowRef } from "vue";
import { editor, Position, Range, Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import { selectFile } from "@kaciras/utilities/browser";

// 这些类型的名字本身就不短，再加上命名空间就太长了，所以做一个别名去掉前缀。
export type IEditorOptions = editor.IEditorOptions;
export type ICommand = editor.ICommand;
export type IEditOperationBuilder = editor.IEditOperationBuilder;
export type ITextModel = editor.ITextModel;
export type ICursorStateComputerData = editor.ICursorStateComputerData;

export enum ViewMode { Split, Edit, Preview}

export interface AddonContext {
	// 编辑器在 Mounted 阶段才创建，setup 阶段不可用。
	editor: editor.ICodeEditor;

	// 修改选区请使用 `editor.setSelection()`
	selection: ShallowRef<Selection>;

	// 仅用于监听，`修改内容请用 editor.executeCommand()`
	text: Ref<string>;
	options: Ref<IEditorOptions>;
	viewMode: Ref<ViewMode>;
	scrollSynced: Ref<boolean>;

	/**
	 * 在全部的光标位置都插入一段文本，如有必要则在前后添加空行，然后移动光标。
	 *
	 * @param text 文本
	 * @param block 是否确保文本处于单独的一行。
	 * @param cursor 光标偏移，相对于 text 的起始位置，默认移动到整个片段的末尾。
	 */
	insertText(text: string, block: boolean, cursor?: number): void;
}

class InsertCommand implements ICommand {

	private readonly point: Position;
	private readonly text: string;
	private readonly block: boolean;
	private readonly cursor?: number;

	prevInserted = false;

	private eolAdded = 2;

	constructor(point: Position, text: string, block: boolean, cursor?: number) {
		this.point = point;
		this.text = text;
		this.cursor = cursor;
		this.block = block;
	}

	computeCursorState(_: any, helper: ICursorStateComputerData) {
		const { cursor, block, text, eolAdded } = this;
		const { range } = helper.getInverseEditOperations()[0];
		let line = range.endLineNumber;

		// 块模式下末尾必然有两个换行，所以移到两行之后的开头。
		if (block && !cursor) {
			line += eolAdded;
			return new Selection(line, 0, line, 0);
		}

		// 非块模式末尾在同一行内，算下列即可。
		const column = range.endColumn + (cursor ?? text.length);
		return new Selection(line, column, line, column);
	}

	private notEmpty(model: ITextModel, n: number) {
		if (n <= 0 || n >= model.getLineCount()) {
			return false;
		}
		return model.getLineLength(n) > 0;
	}

	getEditOperations(model: ITextModel, builder: IEditOperationBuilder) {
		const { text, block, prevInserted } = this;
		const { lineNumber: line, column } = this.point;

		const inserts = ["", "", text, "", ""];
		if (block) {
			const eol = model.getEOL();

			if (column !== 1) {
				inserts[0] = inserts[1] = eol;
			} else if (
				this.notEmpty(model, line - 1)
				|| prevInserted
			) {
				inserts[0] = eol;
			}

			if (column !== model.getLineLength(line) + 1) {
				this.eolAdded = 0;
				inserts[3] = inserts[4] = eol;
			} else if (this.notEmpty(model, line + 1)) {
				inserts[4] = eol;
				this.eolAdded = 1;
			}
		}

		const range = new Range(line, column, line, column);
		builder.addTrackedEditOperation(range, inserts.join(""));
	}
}

const kContext = Symbol();

/**
 * 获取用于跟 MarkdownEditor 交互的对象, 仅在 MarkdownEditor 的 Slot 内可用.
 */
export function useAddonContext() {
	return inject<AddonContext>(kContext)!;
}

export function createAddonContext(ctx: AddonContext) {
	provide(kContext, ctx);

	ctx.insertText = (text, block, cursor) => {
		const { editor } = ctx;
		const positions = editor.getSelections()!.map(s => s.getPosition());

		positions.sort(Position.compare);
		const commands = positions.map(s => new InsertCommand(s, text, block, cursor));

		for (let i = 1; i < positions.length; i++) {
			const prev = positions[i - 1].lineNumber;
			const curr = positions[i].lineNumber;
			commands[i].prevInserted = prev === curr - 1;
		}

		editor.focus();
		editor.executeCommands(null, commands);
	};
}

async function selectMedia(accept: string) {
	const [file] = await selectFile(accept);
	let { name } = file;

	const i = name.lastIndexOf(".");
	if (i !== -1) {
		name = name.slice(0, i);
	}
	return { name, url: URL.createObjectURL(file) };
}

/**
 * MediaWeights 处理函数的一种实现，让用户选择本地文件，保存到内存中，可用于演示。
 *
 * @example
 * <template>
 *     <MediaWeights v-bind='memoryMediaStore'/>
 * </template>
 * <script>
 * import { memoryMediaStore } from "@kaciras-blog/markdown-vue";
 * </script>
 */
export const memoryMediaStore = {
	async image(ctx: AddonContext) {
		const { name, url } = await selectMedia("image/*");
		ctx.insertText(`![${name}](${url})`, false);
	},
	async video(ctx: AddonContext) {
		const { url } = await selectMedia("video/*");
		ctx.insertText(`@video[](${url})`, true);
	},
	async audio(ctx: AddonContext) {
		const { name, url } = await selectMedia("audio/*");
		ctx.insertText(`@audio[${name}](${url})`, true);
	},
};
