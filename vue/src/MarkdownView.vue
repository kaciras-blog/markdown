<!-- 将 Markdown 转换成 HTML 并显示出来的组件。-->
<template>
	<MarkdownBox :html='html' :lazy-loading='lazyLoading'/>
</template>

<script setup lang="ts">
import { guestRenderer, trustedRenderer } from "@kaciras/markdown-core/src/web/presets.ts";
import { LazyLoadOptions } from "@kaciras/markdown-core/src/web/lazy-loading.ts";
import { computed } from "vue";
import MarkdownBox from "./MarkdownBox.vue";

interface MarkdownViewProps {

	/** 要渲染的 Markdown 文本，注意转换过程是同步的。*/
	value: string;

	/** 给文本设置个唯一 ID，由于区分锚点。*/
	docId?: string;

	/** 是否使用文章转换器，默认使用功能更少也更安全的转换配置。*/
	trust?: boolean;

	/** 懒加载相关的选项，默认为空 */
	lazyLoading?: LazyLoadOptions;
}

const props = withDefaults(defineProps<MarkdownViewProps>(), {
	trust: false,
});

const html = computed(() => {
	const { value, trust, docId } = props;
	const renderer = trust
		? trustedRenderer
		: guestRenderer;
	return renderer.render(value, { docId });
});
</script>
