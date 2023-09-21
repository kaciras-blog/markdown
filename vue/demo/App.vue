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
	</MarkdownEditor>
</template>

<script setup lang="ts">
import "@kaciras-blog/uikit/dist/style.css";
import "@kaciras/markdown-core/style.css";
import { shallowRef } from "vue";
import readme from "./KFM-zh.md?raw";
import MarkdownEditor from "../src/MarkdownEditor.vue";
import MediaWeights from "../src/MediaWeights.vue";
import ConfigWeights from "../src/ConfigWeights.vue";
import BaseSyntaxWeights from "../src/BaseSyntaxWeights.vue";

const content = shallowRef(readme);
</script>

<style>
body {
	margin: 0;
}

.editor {
	height: 100vh;
}
</style>
