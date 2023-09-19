<template>
	<span v-if='count !== 0' :class='$style.item'>
		选择：{{ start }} - {{ start + count }} | {{ count }} 字
	</span>
	<span :class='$style.item'>总字数：{{ text.length }}</span>
</template>

<script setup lang="ts">
import { shallowRef, watchEffect } from "vue";
import { Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import { useAddonContext } from "./addon-api.ts";

const { model, text, selection } = useAddonContext();

const start = shallowRef(0);
const count = shallowRef(0);

// https://github.com/microsoft/vscode/blob/15094ed7fded9f2de45488c13b97a8fe64a596ed/src/vs/workbench/browser/parts/editor/editorStatus.ts#L745
watchEffect(() => {
	const { startLineNumber, startColumn } = selection.value;
	const off = Selection.createWithDirection(1, 1, startLineNumber, startColumn, 0);
	start.value = model.value.getCharacterCountInRange(off);
	count.value = model.value.getCharacterCountInRange(selection.value);
});
</script>

<style module>
.item {
	margin: 0 .5em;
}

.element {
	cursor: pointer;
	user-select: none;
	margin-left: .5em;
}

.on {
	color: #00ee3c;
}

.off {
	color: #ff7070;
}
</style>
