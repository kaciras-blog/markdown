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

<script setup lang="ts">
import { shallowRef } from "vue";
import MarkdownEditor from "../src/MarkdownEditor.vue";
import MediaWeights from "../src/MediaWeights.vue";
import ConfigWeights from "../src/ConfigWeights.vue";
import BaseSyntaxWeights from "../src/BaseSyntaxWeights.vue";
import SelectionWeight from "../src/SelectionWeight.vue";
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
