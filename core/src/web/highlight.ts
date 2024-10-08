import hljs from "highlight.js/lib/core";

// 只添加我常用的语言。
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import xml from "highlight.js/lib/languages/xml";
import cs from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import http from "highlight.js/lib/languages/http";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import less from "highlight.js/lib/languages/less";
import lua from "highlight.js/lib/languages/lua";
import protobuf from "highlight.js/lib/languages/protobuf";
import python from "highlight.js/lib/languages/python";
import plaintext from "highlight.js/lib/languages/plaintext";
import rust from "highlight.js/lib/languages/rust";
import scss from "highlight.js/lib/languages/scss";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import typescript from "highlight.js/lib/languages/typescript";
import vue from "./hljs-vue.ts";

hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("cs", cs);
hljs.registerLanguage("css", css);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("go", go);
hljs.registerLanguage("http", http);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("less", less);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("protobuf", protobuf);
hljs.registerLanguage("python", python);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("scss", scss);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("vue", vue);

/*
 * 适配三方的高亮库，同时添加了对差分语法的支持，在讲解代码时挺有用的一功能。
 *
 * # 差分的实现
 * Prism.js 虽有个插件，但它使用 Git 的补丁语法，跟我需要的不一样。
 * 另外 Prism 对 TypeScript 的识别不佳，故仍然用 Highlight.js。
 * https://prismjs.com/plugins/diff-highlight
 *
 * VitePress 的方案更是丑陋至极。
 * https://vitepress.dev/guide/markdown#colored-diffs-in-code-blocks
 *
 * 由于 Highlight.js 没有原生和插件支持，作者也没实现的想法，所以只能自己做了。
 * https://github.com/highlightjs/highlight.js/issues/480
 */

export default function (code: string, language: string) {
	if (!hljs.getLanguage(language)) {
		language = "text";
	}
	return hljs.highlight(code, { language }).value;
}
