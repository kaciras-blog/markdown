<template>
	<MarkdownEditor
		v-model='content'
		class='editor'
	>
		<template #toolbar-right='{ ctx }'>
			<ConfigToolbar :ctx='ctx'/>
		</template>
	</MarkdownEditor>
</template>

<script setup lang="ts">
import "@kaciras-blog/uikit/dist/style.css";
import "@kaciras/markdown-core/src/web/markdown.css";
import { shallowRef } from "vue";
import readme from "./KFM-zh.md?raw";
import MarkdownEditor from "../src/MarkdownEditor.vue";
import ConfigToolbar from "../src/ConfigToolbar.vue";

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
