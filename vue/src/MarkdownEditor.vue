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
			:is-article='true'
			:value='outMarkdown'
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

			<CommonStatusWeights></CommonStatusWeights>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ComponentPublicInstance, nextTick, onMounted, onUnmounted, provide, shallowRef, watch } from "vue";
import { refDebounced, useVModel } from "@vueuse/core";
import { Selection } from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js";
import { AddonContext, kContext, ViewMode } from "./editor-addon.ts";
import MarkdownView from "./MarkdownView.vue";
import CommonStatusWeights from "./CommonStatusWeights.vue";

type DropHandler = (files: FileList, ctx: AddonContext) => boolean | void;

interface MarkdownEditorProps {
	modelValue: string;
	debounce?: number;
	dropHandler?: DropHandler;
}

// For our Markdown editor, only the editor worker is required.
self.MonacoEnvironment = {
	getWorker(_: unknown, label: string) {
		if (label === "editorWorkerService") {
			return new EditorWorker();
		}
		throw new Error(`Unexpected worker label: ${label}`);
	},
};

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
const scrollSynced = shallowRef(true);

let editor: monaco.editor.IStandaloneCodeEditor = undefined!;

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

let lastScrollEditor = false;
let ignoreScroll = false;

function runScrollAction(callback: FrameRequestCallback) {
	if (!scrollSynced.value || ignoreScroll) {
		return;
	}
	ignoreScroll = true;

	// Must delay to the next frame if the user uses smooth scrolling.
	requestAnimationFrame(arg => {
		callback(arg);
		requestAnimationFrame(() => ignoreScroll = false);
	});
}

function scrollEditorToPreview() {
	lastScrollEditor = false;
	runScrollAction(() => {
		const { $el } = previewEl.value!;
		const p = $el.scrollTop / ($el.scrollHeight - $el.offsetHeight);
		const { clientHeight } = editorEl.value!;
		editor.setScrollTop(p * (editor.getScrollHeight() - clientHeight));
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

onUnmounted(() => editor.dispose());

onMounted(() => {
	editor = monaco.editor.create(editorEl.value!, {
		value: content.value,
		language: "markdown",
		wordWrap: "on",
		minimap: { enabled: false },
	});

	addonContext.model.value = editor.getModel()!;

	editor.onDidChangeModelContent(() => {
		content.value = editor.getValue();
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

/* Ensure editor width controlled by grid */
.editor {
	overflow-x: hidden;
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
