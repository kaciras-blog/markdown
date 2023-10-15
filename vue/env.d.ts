/// <reference types="vite/client" />

declare module "monaco-editor/esm/vs/basic-languages/markdown/markdown.js" {
	import { languages } from "monaco-editor";

	export const conf: languages.LanguageConfiguration;
	export const language: languages.IMonarchLanguage;
}
