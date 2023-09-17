import { Plugin } from "vite";
import { minify } from "html-minifier-terser";
import MagicString from "magic-string";

/**
 * Does not work if attribute value contains "/>".
 * https://stackoverflow.com/a/14028108/7065321
 */
const selfCloseRE = /<([^\s>]+)([^>]*)\/>/gs;

const minifyOptions = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	collapseInlineTagWhitespace: true,
	caseSensitive: true,
	removeComments: true,
	removeAttributeQuotes: true,
};

function transformHTML(html: string) {
	return minify(html.replaceAll(selfCloseRE, "<$1$2></$1>"), minifyOptions);
}

/**
 * 支持自闭和标签，以及去除标签间的空白。
 */
export default function htmlStringPlugin(): Plugin {
	let sourcemap: boolean | string;

	return {
		name: "kaciras:html-string",

		configResolved(config) {
			sourcemap = config.build.sourcemap;
		},

		async transform(code, id) {
			if (id.includes("/node_modules/")) {
				return; // 因为没类型，标签可能跟三方库的重复，所以仅处理自己的代码。
			}

			const s = new MagicString(code);
			let i = code.indexOf("$HTML`");
			while (i >= 0) {
				const e = code.indexOf("`;", i);
				let html = code.slice(i + 6, e);

				html = await transformHTML(html);
				s.overwrite(i, e, "`" + html);
				i = code.indexOf("$HTML`", e);
			}

			return !s.hasChanged() ? null : {
				code: s.toString(),
				map: sourcemap ? s.generateMap({ hires: true }) : null,
			};
		},
	};
}
