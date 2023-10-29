<!-- 将 Markdown 转换成 HTML 并显示出来的组件。-->
<template>
	<MarkdownBox :html='html' :lazy-loading='lazyLoading'/>
</template>

<script setup lang='ts'>
import { kfmPreset, LazyLoadOptions, MarkdownIt, PresetOptions } from "@kaciras-blog/markdown";
import { computed } from "vue";
import MarkdownBox from "./MarkdownBox.vue";

export type Renderer = "trusted" | "guest" | "core" | {
	render(text: string, env: any): string;
};

interface MarkdownViewProps {

	/** 要渲染的 Markdown 文本，转换过程是同步的。*/
	value: string;

	/** 设置个唯一 ID，由于区分锚点。*/
	docId?: string;

	/**
	 * Markdown 渲染器，可以为 MarkdownIt 的实例。
	 * 如果是字符串则使用 @kaciras-blog/markdown/presets 里对应的。
	 *
	 * @default "guest"
	 */
	renderer?: Renderer;

	/** 懒加载相关的选项，默认为空 */
	lazyLoading?: LazyLoadOptions;
}

const props = defineProps<MarkdownViewProps>();

const renderer = computed(() => {
	const { renderer } = props;

	if (typeof renderer === "function") {
		return renderer;
	}

	const md = new MarkdownIt();
	const options: PresetOptions = {};

	switch (renderer) {
		case "guest":
			options.guest = true;
			break;
		case "core":
			options.plain = true;
			break;
	}
	return md.use(kfmPreset, options);
});

const html = computed(() => {
	const { value, docId } = props;
	return renderer.value.render(value, { docId });
});
</script>
