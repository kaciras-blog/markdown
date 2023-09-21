import { inject, provide, Ref, ShallowRef } from "vue";
import { editor, Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import IEditorOptions = editor.IEditorOptions;
import ICommand = editor.ICommand;
import IEditOperationBuilder = editor.IEditOperationBuilder;
import ITextModel = editor.ITextModel;
import ICursorStateComputerData = editor.ICursorStateComputerData;

export enum ViewMode { Split, Edit, Preview}

export interface AddonContext {
	// 编辑器在 Mounted 阶段才创建，setup 阶段不可用。
	editor: editor.ICodeEditor;

	// 修改选区请使用 `editor.setSelection()`
	selection: ShallowRef<Selection>;

	options: Ref<IEditorOptions>;
	text: Ref<string>;
	viewMode: Ref<ViewMode>;
	scrollSynced: Ref<boolean>;

	insertText(text: string, isBlock: boolean): void;
}

class InsertCommand implements ICommand {

	readonly selection: Selection;
	readonly text: string;
	readonly isBlock: boolean;

	deltaLine = 0;

	constructor(text: string, selection: Selection, isBlock: boolean) {
		this.text = text;
		this.selection = selection;
		this.isBlock = isBlock;
	}

	computeCursorState(_: ITextModel, __: ICursorStateComputerData) {
		const { selection, deltaLine } = this;
		if (deltaLine === 0) {
			return Selection.fromRange(selection.collapseToEnd(), 0);
		}
		const line = selection.startLineNumber + deltaLine;
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
		const range = selection.getDirection() === 0
			? selection.collapseToEnd()
			: selection.collapseToStart();

		const inserts = ["", "", text, "", ""];
		if (isBlock) {
			const line = range.startLineNumber;
			const eol = model.getEOL();

			if (range.startColumn !== 1) {
				inserts[0] = inserts[1] = eol;
				this.deltaLine += 2;
			} else if (this.notEmpty(model, line - 1)) {
				inserts[0] = eol;
				this.deltaLine += 1;
			}

			if (range.endColumn !== model.getLineLength(line) + 1) {
				inserts[3] = inserts[4] = eol;
				this.deltaLine += 2;
			} else if (this.notEmpty(model, line + 1)) {
				inserts[4] = eol;
				this.deltaLine += 1;
			}
		}

		builder.addEditOperation(range, inserts.join(""));
	}
}

export const kContext = Symbol();

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
