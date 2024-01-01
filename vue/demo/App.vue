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
import { shallowRef } from "vue";
import {
	BaseSyntaxWeights,
	ConfigWeights,
	MarkdownEditor,
	MediaWeights,
	memoryMediaStore,
	SelectionWeight,
} from "../src/entry-index.ts";
import document from "./KFM-zh.md?raw";

const content = shallowRef(document);
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
