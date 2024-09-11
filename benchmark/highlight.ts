import { defineSuite } from "esbench";
import { highlight } from "../core/lib/index.js";
import vue from "../vue/src/MarkdownEditor.vue?raw";
import yaml from "../pnpm-lock.yaml?raw";
import ts from "../core/src/directive.ts?raw";

function getLang(code: string) {
	switch (code) {
		case vue: return "vue";
		case ts: return "ts";
		case yaml: return "yaml";
	}
	throw new TypeError("Should not happen");
}

export default defineSuite({
	params: {
		code: { vue, yaml, ts },
	},
	setup(scene) {
		const { code } = scene.params;
		const lang = getLang(code);
		scene.bench("highlight.js", () => highlight(code, lang));
	},
});
