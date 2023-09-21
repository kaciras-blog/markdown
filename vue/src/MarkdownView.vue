<!-- 将 Markdown 转换成 HTML 并显示出来的组件。-->
<template>
	<MarkdownBox :html='html' :lazy-loading='lazyLoading'/>
</template>

<script setup lang="ts">
import { guestRenderer, trustedRenderer } from "@kaciras-blog/markdown/presets";
import { LazyLoadOptions } from "@kaciras-blog/markdown/activate";
import { computed } from "vue";
import MarkdownBox from "./MarkdownBox.vue";

interface MarkdownViewProps {

	/** 要渲染的 Markdown 文本，转换过程是同步的。*/
	value: string;

	/** 设置个唯一 ID，由于区分锚点。*/
	docId?: string;

	/**
	 * 使用 trustedRenderer 渲染，默认使用的是 guestRenderer。
	 * 两者的差别见它们的注释，无论哪一个都不存在 XSS 问题。
	 */
	trust?: boolean;

	/** 懒加载相关的选项，默认为空 */
	lazyLoading?: LazyLoadOptions;
}

const props = defineProps<MarkdownViewProps>();

const html = computed(() => {
	const { value, trust, docId } = props;
	const renderer = trust
		? trustedRenderer
		: guestRenderer;
	return renderer.render(value, { docId });
});
</script>
