/*
 * Language: Vue.js
 * Requires: xml.js, javascript.js, typescript.js, css.js, stylus.js, scss.js
 * Author: Sara Lissette Luis Ibáñez <lissette.ibnz@gmail.com>
 * Description: Single-File Components of Vue.js Framework.
 *
 * Modified by Kaciras <Kaciras@outlook.com>
 *
 * The original source:
 * https://github.com/highlightjs/highlightjs-vue/blob/master/vue.js
 */
import { HLJSApi, Language } from "highlight.js";

/**
 * highlight.js 的 Vue SFC 插件，支持解析顶层的语言块（language blocks）。
 *
 * 块支持那些语言由构建工具决定，这里只包含了常用的几种。
 * https://vuejs.org/api/sfc-spec.html#pre-processors
 *
 * highlight.js 的类型里有个 vuePlugin 属性，但却是 undefined。
 */
export default function hljsDefineVue(hljs: HLJSApi): Language {
	return {
		subLanguage: "xml",
		contains: [
			hljs.COMMENT("<!--", "-->", {
				relevance: 10,
			}),
			{
				begin: /^\s*<script\s.*?lang=(["'])ts\1.*?>/gm,
				end: /^\s*<\/script>/gm,
				excludeBegin: true,
				excludeEnd: true,
				subLanguage: "typescript",
			},
			{
				begin: /^\s*<script.*?>/gm,
				end: /^\s*<\/script>/gm,
				excludeBegin: true,
				excludeEnd: true,
				subLanguage: "javascript",
			},
			{
				begin: /^\s*<style\s.*?lang=(["'])s[ca]ss\1.*?>/gm,
				end: /^\s*<\/style>/gm,
				excludeBegin: true,
				excludeEnd: true,
				subLanguage: "scss",
			},
			{
				begin: /^\s*<style\s.*?lang=(["'])less\1.*?>/gm,
				end: /^\s*<\/style>/gm,
				excludeBegin: true,
				excludeEnd: true,
				subLanguage: "less",
			},
			{
				begin: /^\s*<style\s.*?lang=(["'])stylus\1.*?>/gm,
				end: /^\s*<\/style>/gm,
				excludeBegin: true,
				excludeEnd: true,
				subLanguage: "stylus",
			},
			{
				begin: /^\s*<style.*?>/gm,
				end: /^\s*<\/style>/gm,
				excludeBegin: true,
				excludeEnd: true,
				subLanguage: "css",
			},
		],
	};
}
