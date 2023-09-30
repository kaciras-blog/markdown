<template>
	<span v-if='count !== 0' :class='$style.item'>
		选择：{{ start }} - {{ start + count }} | {{ count }} 字
	</span>
	<span :class='$style.item'>
		总字数：{{ context.text.value.length }}
	</span>
</template>

<script setup lang="ts">
import { shallowRef, watch } from "vue";
import { Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import { useAddonContext } from "./addon-api.ts";

const context = useAddonContext();

const start = shallowRef(0);
const count = shallowRef(0);

// monaco-editor 将内容按行存储，选区也是，故光标的绝对位置需要计算一下。
// https://github.com/microsoft/vscode/blob/15094ed7fded9f2de45488c13b97a8fe64a596ed/src/vs/workbench/browser/parts/editor/editorStatus.ts#L745
watch(context.selection, (selection) => {
	const { startLineNumber, startColumn } = selection;
	const model = context.editor.getModel()!;

	const offset = Selection.createWithDirection(1, 1, startLineNumber, startColumn, 0);
	start.value = model.getCharacterCountInRange(offset);
	count.value = model.getCharacterCountInRange(selection);
});
</script>

<style module>
.item {
	margin: 0 .5em;
}
</style>
