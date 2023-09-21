import { inject, Ref, ShallowRef } from "vue";
import { editor, Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import IEditorOptions = editor.IEditorOptions;

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
}

export const kContext = Symbol();

export function useAddonContext() {
	return inject<AddonContext>(kContext)!;
}
