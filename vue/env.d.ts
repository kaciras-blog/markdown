/// <reference types="vite/client" />

declare module "monaco-editor/esm/vs/basic-languages/markdown/markdown.js" {
	import { languages } from "monaco-editor";

	export const conf: languages.LanguageConfiguration;
	export const language: languages.IMonarchLanguage;
}

declare module "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles.js";
