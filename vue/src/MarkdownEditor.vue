<template>
	<div :class='$style.container'>
		<div :class='$style.toolbar' role='toolbar'>
			<slot name='toolbar-left'/>
			<span :class='$style.span'/>
			<slot name='toolbar-right'/>
		</div>

		<div
			v-show='viewMode !== ViewMode.Preview'
			ref='editorEl'
			:class='{
				[$style.window]: true,
				[$style.single]: viewMode === ViewMode.Edit,
			}'
			@dragover.prevent
			@drop='handleDrop'
			@scroll='lastScrollPreview = false'
		/>
		<MarkdownView
			v-show='viewMode !== ViewMode.Edit'
			ref='previewEl'
			:is-article='true'
			:value='outMarkdown'
			:class='{
				[$style.preview]: true,
				[$style.single]: viewMode === ViewMode.Preview,
			}'
			@scroll='lastScrollPreview = true'
		/>

		<div :class='$style.status' role='toolbar'>
			<slot name='status-left'/>
			<span :class='$style.span'/>
			<slot name='status-right'/>

			<CommonStatusWeights></CommonStatusWeights>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ComponentPublicInstance, computed, nextTick, onMounted, onUnmounted, provide, shallowRef, watch } from "vue";
import { refDebounced, useVModel } from "@vueuse/core";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js";
import { syncScroll } from "@kaciras/utilities/browser";
import { AddonContext, kContext, ViewMode } from "./editor-addon";
import MarkdownView from "./MarkdownView.vue";
import CommonStatusWeights from "./TextStateGroup.vue";
import { Selection } from "monaco-editor";

type DropHandler = (files: FileList, ctx: AddonContext) => boolean | void;

interface MarkdownEditorProps {
	modelValue: string;
	debounce?: number;
	dropHandler?: DropHandler;
}

const props = withDefaults(defineProps<MarkdownEditorProps>(), {
	debounce: 500,
	dropHandler: () => false,
});

const emit = defineEmits(["update:modelValue"]);

const content = useVModel(props, "modelValue", emit);
const outMarkdown = refDebounced(content, props.debounce);
const editorEl = shallowRef<HTMLElement>();
const previewEl = shallowRef<ComponentPublicInstance>();
const viewMode = shallowRef(ViewMode.Split);
const lastScrollPreview = shallowRef(false);
const disableSyncScroll = shallowRef<(() => void) | null>(null);

let editor: monaco.editor.IStandaloneCodeEditor = undefined!;

/**
 * 设置是否启用同步滚动，如果由关闭变为开启则会立即触发同步。
 *
 * 立即同步时以最后滚动的一方作为目标，另一方调整滚动位置与对方同步。
 */
const scrollSynced = computed({
	get: () => Boolean(disableSyncScroll.value),
	set(enabled) {
		const disable = disableSyncScroll.value;

		if (!enabled && disable) {
			disableSyncScroll.value = null;
			return disable();
		}

		const preview = previewEl.value!.$el;
		const textarea = editorEl.value!;

		disableSyncScroll.value = lastScrollPreview.value
			? syncScroll(preview, textarea)
			: syncScroll(textarea, preview);
	},
});


const addonContext: AddonContext = {
	viewMode,
	scrollSynced,
	text: content,
	model: shallowRef(monaco.editor.createModel("")),
	selection: shallowRef(Selection.createWithDirection(0, 0, 0, 0, 0)),
};

provide(kContext, addonContext);

watch(viewMode, () => nextTick(() => editor.layout()));

function handleDrop(event: DragEvent) {
	const { files } = event.dataTransfer!;
	if (props.dropHandler(files, addonContext)) {
		return event.preventDefault();
	}
}

onMounted(() => {
	editor = monaco.editor.create(editorEl.value!, {
		value: content.value,
		language: "markdown",
		wordWrap: "on",
		minimap: { enabled: false },
	});

	scrollSynced.value = true;
	addonContext.model.value = editor.getModel()!;

	editor.onDidChangeModelContent(() => {
		content.value = editor.getValue();
	});

	editor.onDidChangeCursorSelection(e => {
		addonContext.selection.value = e.selection;
	});

	editor.onDidScrollChange(e => {
		e.scrollTop;
	});
});

onUnmounted(() => editor.dispose());
</script>

<style module>
.container {
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: auto 1fr auto;
}

.toolbar {
	grid-column: 1/3;

	display: flex;
	background-color: whitesmoke;
	--btn-radius: 0;
}

.span {
	flex: 1;
}

.status {
	grid-column: 1/3;

	display: flex;
	line-height: 22px;
	padding: 0 .5em;
	color: white;
	background-color: #003ee7;
}

.window {
	/*margin: 0;*/
	/*border: none;*/

	/*background-color: white;*/
	/*resize: none;*/
}

.preview {
	padding: .5rem .8rem 0 .8rem;
	font-size: initial;
	overflow-y: scroll;
}

.single {
	grid-column: 1/3;
	display: block;

	@media (min-width: 768px) {
		margin-left: 10%;
		margin-right: 10%;
	}
	@media (min-width: 1200px) {
		margin-left: 16%;
		margin-right: 16%;
	}
}
</style>
