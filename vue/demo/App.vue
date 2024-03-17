<template>
	<MarkdownEditor
		v-model='content'
		renderer='rich'
		class='editor'
	>
		<!-- 顶部工具栏左右两侧的控件 -->
		<template #toolbar-left>
			<BaseSyntaxWeights></BaseSyntaxWeights>
			<MediaWeights v-bind='memoryMediaStore'/>
		</template>
		<template #toolbar-right>
			<ToolButton
				title='重置内容'
				@click='resetContent'
			>
				<IconX/>
			</ToolButton>
			<VerticalSeparator/>
			<ConfigWeights></ConfigWeights>
		</template>

		<!-- 底部状态栏左右两侧的控件 -->
		<template #status-left>
			<!-- Empty -->
		</template>
		<template #status-right>
			<SelectionWeight></SelectionWeight>
		</template>
	</MarkdownEditor>
</template>

<script setup lang='ts'>
import { useLocalStorage } from "@vueuse/core";
import { IconX } from "@tabler/icons-vue";
import {
	BaseSyntaxWeights,
	ConfigWeights,
	MarkdownEditor,
	MediaWeights,
	memoryMediaStore,
	SelectionWeight,
	ToolButton,
	VerticalSeparator,
} from "../src/index.ts";
import document from "./KFM-zh.md?raw";

const content = useLocalStorage("Content", document, {
	writeDefaults: false,
});

// 不能写在模板里，因为类型检查不认 RemovableRef 增加的 setter 参数。
const resetContent = () => content.value = null;
</script>

<style>
body {
	margin: 0;
	color: #222;
	font-family: sans-serif;
	font-size: 1rem;
}

.editor {
	height: 100vh;
}
</style>
