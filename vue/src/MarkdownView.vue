<!-- 将 Markdown 转换成 HTML 并显示出来的组件。-->
<template>
	<MarkdownBox :html='html' :lazy-loading='lazyLoading'/>
</template>

<script lang='ts'>
import { kfmPreset, MarkdownIt } from "@kaciras-blog/markdown";

// 把几个预设提前放这，免得跟随组件实例每次都创建。
const rich = new MarkdownIt();
rich.use(kfmPreset);

const guest = new MarkdownIt();
guest.use(kfmPreset, { guest: true });
</script>

<script setup lang='ts'>
import { LazyLoadOptions } from "@kaciras-blog/markdown";
import { computed } from "vue";
import MarkdownBox from "./MarkdownBox.vue";

export type Renderer = "rich" | "guest"  | {
	render(text: string, env: object): string;
};

export interface MarkdownViewProps {
	/**
	 * 要渲染的 Markdown 文本，转换过程是同步的。
	 */
	value: string;

	/** 设置个唯一 ID，由于区分锚点。*/
	docId?: string;

	/**
	 * Markdown 渲染器，可以为 MarkdownIt 的实例。
	 * 如果是字符串则使用预设，详见源码里上面的 script 块。
	 *
	 * @default "guest"
	 */
	renderer?: Renderer;

	/** 懒加载相关的选项，默认为空 */
	lazyLoading?: LazyLoadOptions;
}

const props = defineProps<MarkdownViewProps>();

const html = computed(() => {
	const { value, renderer, docId } = props;
	let resolved = guest;

	switch (renderer) {
		case undefined:
		case "guest":
			break;
		case "rich":
			resolved = rich;
			break;
		default:
			resolved = renderer as any;
	}

	return resolved.render(value, { docId });
});
</script>
