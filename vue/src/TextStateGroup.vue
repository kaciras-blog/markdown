<template>
	<span v-if='count !== 0' :class='$style.item'>
		选择：{{ start }} - {{ start + count }} | {{ count }} 字
	</span>
	<span :class='$style.item'>总字数：{{ text.length }}</span>

	<span
		v-if='scrollSynced'
		:class='[$style.element, $style.on]'
		@click='scrollSynced = false'
	>
		同步滚动开
	</span>
	<span
		v-else
		:class='[$style.element, $style.off]'
		@click='scrollSynced = true'
	>
		同步滚动关
	</span>
</template>

<script setup lang="ts">
import { shallowRef, watchEffect } from "vue";
import { useAddonContext } from "./editor-addon";
import { Selection } from "monaco-editor";

const { model, text, selection, scrollSynced } = useAddonContext();

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
