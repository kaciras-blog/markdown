import hljs from "highlight.js/lib/core";

// TreeShaking 优化，只添加我常用的语言。
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
import rust from "highlight.js/lib/languages/rust";
import scss from "highlight.js/lib/languages/scss";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import typescript from "highlight.js/lib/languages/typescript";

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
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("scss", scss);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("typescript", typescript);

export default function (code: string, language: string, diff: boolean) {
	if (!hljs.getLanguage(language)) {
		return undefined;
	}
	if (!diff) {
		return hljs.highlight(code, { language }).value;
	}

	let lines = code.split("\n");
	const changes = new Map<number, boolean>();
	const size = lines.length;

	for (let i = 0; i < size; i++) {
		switch (lines[i].charCodeAt(0)) {
			case 43: /* + */
				changes.set(i, true);
				break;
			case 45: /* - */
				changes.set(i, false);
				break;
			default:
				continue;
		}
		lines[i] = lines[i].slice(1);
	}

	code = lines.join("\n");
	code = hljs.highlight(code, { language }).value;
	lines = code.split("\n");

	const htmlFragments = [];
	for (let i = 0; i < size; i++) {
		if (changes.has(i - 1)) {
			htmlFragments.push("</span>");
		}
		switch (changes.get(i)) {
			case true:
				htmlFragments.push("<span class='hljs-insert'>");
				break;
			case false:
				htmlFragments.push("<span class='hljs-delete'>");
				break;
		}
		htmlFragments.push(lines[i], "\n");
	}

	htmlFragments.pop();
	return htmlFragments.join("");
}
