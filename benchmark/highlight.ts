import { defineSuite } from "esbench";
import { codeToHtml } from "shiki";
import { highlight } from "../core/lib/index.js";
import vue from "../vue/src/MarkdownEditor.vue?raw";
import yaml from "../pnpm-lock.yaml?raw";
import ts from "../core/src/directive.ts?raw";

const codeMap = { vue, yaml, ts };

// 经测试 Shiki 比 hljs 慢太多，没必要切换。
function applyShiki(code: string, lang: string) {
	return codeToHtml(code, { lang, theme: "dracula" });
}

export default defineSuite({
	params: {
		lang: Object.keys(codeMap) as Array<keyof typeof codeMap>,
	},
	setup(scene) {
		const { lang } = scene.params;
		const code = codeMap[lang];

		scene.bench("highlight.js", () => highlight(code, lang));
		scene.benchAsync("shiki.js", () => applyShiki(code, lang));
	},
});
