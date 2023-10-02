<template>
	<MarkdownEditor
		v-model='content'
		:trust='true'
		class='editor'
	>
		<template #toolbar-left>
			<BaseSyntaxWeights></BaseSyntaxWeights>
			<MediaWeights></MediaWeights>
		</template>
		<template #toolbar-right>
			<ConfigWeights></ConfigWeights>
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
