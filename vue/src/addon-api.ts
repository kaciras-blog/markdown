import { inject, provide, Ref, ShallowRef } from "vue";
import { editor, Range, Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
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
	 * 在光标位置插入一段文本，如有必要则在前后添加空行，然后移动光标。
	 *
	 * @param text 文本
	 * @param block 是否确保文本处于单独的一行。
	 * @param cursor 光标偏移，相对于 text 的起始位置，默认移动到整个片段的末尾。
	 */
	insertText(text: string, block: boolean, cursor?: number): void;
}

class InsertCommand implements ICommand {

	private readonly selection: Selection;
	private readonly text: string;
	private readonly block: boolean;
	private readonly cursor?: number;

	private deltaLine = 0;
	private point!: Range;

	constructor(text: string, selection: Selection, block: boolean, cursor?: number) {
		this.text = text;
		this.selection = selection;
		this.cursor = cursor;
		this.block = block;
	}

	computeCursorState() {
		const { deltaLine, point, cursor, block, text } = this;
		let line = point.endLineNumber + deltaLine;

		if (block && !cursor) {
			line += 2;
			return new Selection(line, 0, line, 0);
		}

		const column = point.endColumn + (cursor ?? text.length);
		return new Selection(line, column, line, column);
	}

	private notEmpty(model: ITextModel, n: number) {
		if (n <= 0 || n >= model.getLineCount()) {
			return false;
		}
		return model.getLineLength(n) > 0;
	}

	getEditOperations(model: ITextModel, builder: IEditOperationBuilder) {
		const { selection, text, block } = this;
		const point = this.point = selection.getDirection() === 0
			? selection.collapseToEnd()
			: selection.collapseToStart();

		const inserts = ["", "", text, "", ""];
		if (block) {
			const line = point.startLineNumber;
			const eol = model.getEOL();

			if (point.startColumn !== 1) {
				inserts[0] = inserts[1] = eol;
				this.deltaLine = 2;
			} else if (this.notEmpty(model, line - 1)) {
				inserts[0] = eol;
				this.deltaLine = 1;
			}

			if (point.endColumn !== model.getLineLength(line) + 1) {
				inserts[3] = inserts[4] = eol;
			} else if (this.notEmpty(model, line + 1)) {
				inserts[4] = eol;
			}
		}

		builder.addEditOperation(point, inserts.join(""));
	}
}

const kContext = Symbol();

export function useAddonContext() {
	return inject<AddonContext>(kContext)!;
}

export function createAddonContext(ctx: AddonContext) {
	provide(kContext, ctx);

	ctx.insertText = (text, block, cursor) => {
		const { editor } = ctx;
		const commands = [];
		for (const range of editor.getSelections()!) {
			commands.push(new InsertCommand(text, range, block, cursor));
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
