import { inject, provide, Ref, ShallowRef } from "vue";
import { editor, Range, Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import { selectFile } from "@kaciras/utilities/browser";

// 这些类型的名字本身就不短，再加上命名空间就太长了，所以做一个别名去掉前缀。
export type IEditorOptions = editor.IEditorOptions;
export type ICommand = editor.ICommand;
export type IEditOperationBuilder = editor.IEditOperationBuilder;
export type ITextModel = editor.ITextModel;

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
	 * 在当前光标位置插入一段文本，然后移动光标到插入文本的末尾。
	 *
	 * @param text 文本
	 * @param isBlock 是否要确保文本处于单独的一行。
	 */
	insertText(text: string, isBlock: boolean): void;
}

class InsertCommand implements ICommand {

	readonly selection: Selection;
	readonly text: string;
	readonly isBlock: boolean;

	deltaLine = 0;
	point!: Range;

	constructor(text: string, selection: Selection, isBlock: boolean) {
		this.text = text;
		this.selection = selection;
		this.isBlock = isBlock;
	}

	computeCursorState() {
		const { deltaLine, point } = this;
		if (deltaLine === 0) {
			return Selection.fromRange(point, 0);
		}
		const line = point.endLineNumber + deltaLine;
		return new Selection(line, 0, line, 0);
	}

	private notEmpty(model: ITextModel, n: number) {
		if (n <= 0 || n >= model.getLineCount()) {
			return false;
		}
		return model.getLineLength(n) > 0;
	}

	getEditOperations(model: ITextModel, builder: IEditOperationBuilder) {
		const { selection, text, isBlock } = this;
		const point = this.point = selection.getDirection() === 0
			? selection.collapseToEnd()
			: selection.collapseToStart();

		const inserts = ["", "", text, "", ""];
		if (isBlock) {
			const line = point.startLineNumber;
			const eol = model.getEOL();

			if (point.startColumn !== 1) {
				inserts[0] = inserts[1] = eol;
				this.deltaLine += 2;
			} else if (this.notEmpty(model, line - 1)) {
				inserts[0] = eol;
				this.deltaLine += 1;
			}

			if (point.endColumn !== model.getLineLength(line) + 1) {
				inserts[3] = inserts[4] = eol;
				this.deltaLine += 2;
			} else if (this.notEmpty(model, line + 1)) {
				inserts[4] = eol;
				this.deltaLine += 1;
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

	ctx.insertText = (text, isBlock) => {
		const { editor, selection: { value: range } } = ctx;
		const command = new InsertCommand(text, range, isBlock);
		editor.focus();
		editor.executeCommand("md.insert", command);
	};
}

function basename(name: string) {
	const i = name.lastIndexOf(".");
	return i === -1 ? name : name.slice(0, i);
}

/**
 * MediaWeights 的一种实现，弹出文件选择器选择媒体，保存到内存中，可用于演示。
 *
 * @example
 * <template>
 *     <MediaWeights v-bind='memoryMediaStore'/>
 * </template>
 * <script>
 *     import { memoryMediaStore } from "@kaciras-blog/markdown-vue";
 * </script>
 */
export const memoryMediaStore = {
	async image(ctx: AddonContext) {
		const [file] = await selectFile("image/*");
		const url = URL.createObjectURL(file);
		ctx.insertText(`![${basename(file.name)}](${url})`, false);
	},
	async video(ctx: AddonContext) {
		const [file] = await selectFile("video/*");
		const url = URL.createObjectURL(file);
		ctx.insertText(`@video[](${url})`, true);
	},
	async audio(ctx: AddonContext) {
		const [file] = await selectFile("audio/*");
		const url = URL.createObjectURL(file);
		ctx.insertText(`@audio[${basename(file.name)}](${url})`, true);
	},
};
