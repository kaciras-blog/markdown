<!--
	显示已经转换好的 Markdown HTML，并激活它。
	该组件不引入转换器，配合后端生成好的页面可以减轻 JS 文件。
-->
<template>
	<div :ref='setup' class='markdown' v-html='html'/>
</template>

<script setup lang="ts">
import { activate, LazyLoadOptions } from "@kaciras/markdown-core/activate";
import { noop } from "@kaciras/utilities/browser";

interface MarkdownBoxProps {
	html: string;
	lazyLoading?: LazyLoadOptions;
}

const props = defineProps<MarkdownBoxProps>();

/*
 * 无论是 :ref 还是自定义指令，它们在上层组件渲染时都会调用，即使 html 没有变化。
 * 这就导致可能出现多余的激活调用，为了避免就对比一下 HTML，跳过相同的。
 *
 * v-memo 也能解决问题，但它必须写在调用方，增加了复杂度。
 *
 * prev 仅在 html 修改到 setup 结束短暂的时间保持旧引用，对性能无影响。
 */
let prev: string;
let disconnect = noop;

function setup(el: HTMLElement | null) {
	const { html, lazyLoading } = props;
	if (!el) {
		disconnect();
		disconnect = noop;
	} else if (disconnect === noop || prev !== html) {
		prev = html;
		disconnect = activate(el, lazyLoading);
	}
}
</script>
