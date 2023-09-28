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
				[$style.editor]: true,
				[$style.single]: viewMode === ViewMode.Edit,
			}'
			@dragover.prevent
			@drop='handleDrop'
		/>
		<MarkdownView
			v-show='viewMode !== ViewMode.Edit'
			ref='previewEl'
			:trust='trust'
			:value='debounced'
			:class='{
				[$style.preview]: true,
				[$style.single]: viewMode === ViewMode.Preview,
			}'
			@scroll='scrollEditorToPreview'
		/>

		<div :class='$style.status' role='toolbar'>
			<slot name='status-left'/>
			<span :class='$style.span'/>
			<slot name='status-right'/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ComponentPublicInstance, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { refDebounced, useVModel } from "@vueuse/core";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js";
import "monaco-editor/esm/vs/editor/contrib/dnd/browser/dnd.js";
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles.js";
import "monaco-editor/esm/vs/editor/contrib/multicursor/browser/multicursor.js";
import MarkdownView from "./MarkdownView.vue";
import { AddonContext, createAddonContext, ViewMode } from "./addon-api.ts";

/**
 * TODO: monaco 默认光标不随拖拽而移动，dnd 插件没有公开 API，插入点会有问题。
 *
 * @param files 拖放到编辑器的文件列表
 * @param ctx 编辑器上下文
 * @return true 表示已经处理完成，无需再执行默认的行为。
 */
type DropHandler = (files: FileList, ctx: AddonContext) => boolean | void;

interface MarkdownEditorProps {
	modelValue: string;
	trust?: boolean;
	debounce?: number;
	dropHandler?: DropHandler;
}

const props = withDefaults(defineProps<MarkdownEditorProps>(), {
	debounce: 500,
	dropHandler: () => false,
});

const emit = defineEmits(["update:modelValue"]);

const content = useVModel(props, "modelValue", emit);
const debounced = refDebounced(content, props.debounce);
const editorEl = shallowRef<HTMLElement>();
const previewEl = shallowRef<ComponentPublicInstance>();
const viewMode = shallowRef(ViewMode.Split);
const scrollSynced = shallowRef(true);

let editor: monaco.editor.IStandaloneCodeEditor = undefined!;

const addonContext: AddonContext = <any>{
	options: ref({
		quickSuggestions: false,
		wordWrap: "on",
		minimap: { enabled: false },
	}),
	viewMode,
	scrollSynced,
	editor,
	text: content,
	selection: shallowRef(new monaco.Selection(0, 0, 0, 0)),
};

createAddonContext(addonContext);

watch(viewMode, () => nextTick(() => editor.layout()));

function handleDrop(event: DragEvent) {
	const { files } = event.dataTransfer!;
	if (props.dropHandler(files, addonContext)) {
		return event.preventDefault();
	}
}

let lastScrollEditor = false;
let ignoreScroll = false;

function runScrollAction(callback: () => void) {
	if (!scrollSynced.value || ignoreScroll) {
		return;
	}
	ignoreScroll = true;

	// Must delay to the next frame if the user uses smooth scrolling.
	requestAnimationFrame(() => {
		callback();
		requestAnimationFrame(() => ignoreScroll = false);
	});
}

function scrollEditorToPreview() {
	lastScrollEditor = false;
	runScrollAction(() => {
		const { $el } = previewEl.value!;
		const p = $el.scrollTop / ($el.scrollHeight - $el.offsetHeight);
		const { offsetHeight } = editorEl.value!;
		editor.setScrollTop(p * (editor.getScrollHeight() - offsetHeight * 2));
	});
}

function scrollPreviewToEditor() {
	lastScrollEditor = true;
	runScrollAction(() => {
		const { offsetHeight } = editorEl.value!;
		const { $el } = previewEl.value!;
		const p = editor.getScrollTop() / (editor.getScrollHeight() - offsetHeight * 2);
		$el.scrollTop = p * ($el.scrollHeight - $el.offsetHeight);
	});
}

watch(scrollSynced, enabled => {
	if (!enabled) {
		return;
	}
	if (lastScrollEditor) {
		scrollPreviewToEditor();
	} else {
		scrollEditorToPreview();
	}
});

watch(addonContext.options,
	value => editor.updateOptions(value),
	{ deep: true });

onUnmounted(() => editor.dispose());

onMounted(() => {
	editor = monaco.editor.create(editorEl.value!, {
		value: content.value,
		language: "markdown",
		scrollbar: { useShadows: false },
		...addonContext.options.value,
	});

	addonContext.editor = editor;

	editor.onDidChangeModelContent(() => {
		content.value = editor.getValue({
			lineEnding: "\n",
			preserveBOM: false,
		});
	});

	editor.onDidChangeCursorSelection(e => {
		addonContext.selection.value = e.selection;
	});

	editor.onDidScrollChange(scrollPreviewToEditor);
});
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
	background-color: #0074e8;
}

/* Ensure editor width controlled by grid */
.editor {
	overflow-x: hidden;
}

.preview {
	padding: .5rem .8rem 0 .8rem;
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
