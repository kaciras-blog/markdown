import { defineSuite } from "esbench";
import { codeToHtml } from "shiki";
import Prism from "prismjs";
import "prismjs/components/prism-yaml";
import highlight from "../core/src/web/highlight.ts";
import "prismjs/components/prism-typescript";
import vue from "../vue/src/MarkdownEditor.vue?raw";
import yaml from "../pnpm-lock.yaml?raw";
import ts from "../core/src/directive.ts?raw";

const codeMap = { vue, yaml, ts };

// 经测试 Shiki 比 hljs 慢太多（4x ~ 160x），没必要切换。
function applyShiki(code: string, lang: string) {
	return codeToHtml(code, { lang, theme: "dracula" });
}

export default defineSuite({
	params: {
		lang: Object.keys(codeMap) as Array<keyof typeof codeMap>,
	},
	baseline: {
		type: "Name",
		value: "highlight.js",
	},
	setup(scene) {
		const { lang } = scene.params;
		const code = codeMap[lang];

		// 这废物库还不支持 Vue，等 2.0
		if (lang !== "vue") {
			scene.bench("Prism", () => Prism.highlight(code, Prism.languages[lang], lang));
		}

		scene.bench("highlight.js", () => highlight(code, lang));
		scene.benchAsync("shiki.js", () => applyShiki(code, lang));
	},
});
