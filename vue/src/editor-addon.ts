import { inject, Ref, ShallowRef } from "vue";
import { editor, Selection } from "monaco-editor";
import ITextModel = editor.ITextModel;

export enum ViewMode { Split, Edit, Preview}

export interface AddonContext {
	editor: editor.ICodeEditor;
	model: ShallowRef<ITextModel>;
	selection: ShallowRef<Selection>;
	text: Ref<string>;
	viewMode: Ref<ViewMode>;
	scrollSynced: Ref<boolean>;
}

export const kContext = Symbol();

export function useAddonContext() {
	return inject<AddonContext>(kContext)!;
}
