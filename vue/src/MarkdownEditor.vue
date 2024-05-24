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
			:class='[
				$style.editor,
				viewMode === ViewMode.Edit && $style.single,
			]'
			@dragover.prevent
			@drop='handleDrop'
		/>
		<MarkdownView
			v-show='viewMode !== ViewMode.Edit'
			ref='previewEl'
			:renderer='editorRenderer'
			:value='debounced'
			:class='[
				$style.preview,
				viewMode === ViewMode.Preview && $style.single,
			]'
		/>

		<div :class='$style.status' role='toolbar'>
			<slot name='status-left'/>
			<span :class='$style.span'/>
			<slot name='status-right'/>
		</div>
	</div>
</template>

<script lang='ts'>
import * as md from "monaco-editor/esm/vs/basic-languages/markdown/markdown.js";
import { kfmPreset, MarkdownIt, sourceLine } from "@kaciras-blog/markdown";

// TODO: 要为了通用性，解耦渲染器吗？
const rich = new MarkdownIt();
rich.use(kfmPreset);
rich.use(sourceLine);

const guest = new MarkdownIt();
guest.use(kfmPreset, { guest: true });
guest.use(sourceLine);

const WORD_SEPARATORS =
	'`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?'	// USUAL_WORD_SEPARATORS
	+ "·！￥…*（）—【】：；‘’“”、《》，。？"	// 中文符号。
	+ "「」｛｝＜＞・～＠＃＄％＾＆＊＝『』";	// 日韩符号。

// 给自定义的两个语法 TOC 和 Directive 添加解析支持。
const { tokenizer } = md.language;
tokenizer.root.unshift([/^(\[\[TOC]])/, ["keyword.toc"]]);
tokenizer.root.unshift([
	/^(@\w+)(!?\[)((?:[^\]\\]|@escapes)*)(]\([^)]+\))/,
	["type.directive", "string.link", "", "string.link"],
]);
</script>

<script setup lang='ts'>
import { ComponentPublicInstance, computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { refDebounced } from "@vueuse/core";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js";
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles.js";
import "monaco-editor/esm/vs/editor/contrib/wordOperations/browser/wordOperations.js";
import "monaco-editor/esm/vs/editor/contrib/linesOperations/browser/linesOperations.js";
import "monaco-editor/esm/vs/editor/contrib/dnd/browser/dnd.js";
import "monaco-editor/esm/vs/editor/contrib/multicursor/browser/multicursor.js";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js";
import MarkdownView, { Renderer } from "./MarkdownView.vue";
import setupScrollSync from "./sync-scroll.ts";
import { AddonContext, createAddonContext, ViewMode } from "./addon-api.ts";

/**
 * TODO: monaco 默认光标不随拖拽而移动，dnd 插件没有公开 API，插入点会有问题。
 * https://github.com/microsoft/monaco-editor/issues/3359
 *
 * @param files 拖放到编辑器的文件列表
 * @param ctx 编辑器上下文
 * @return true 表示已经处理完成，无需再执行默认的行为。
 */
type DropHandler = (files: FileList, ctx: AddonContext) => boolean | void;

export interface MarkdownEditorProps {

	/**
	 * Markdown 渲染器，可以为 MarkdownIt 的实例。
	 * 如果是字符串则使用 @kaciras-blog/markdown/presets 里对应的。
	 */
	renderer?: Renderer;

	/**
	 * 渲染函数的防抖（毫秒）。
	 *
	 * @default 500
	 */
	debounce?: number;

	/**
	 * 拖放处理器，如果没有则由 monaco-editor 处理。
	 */
	dropHandler?: DropHandler;
}

const props = withDefaults(defineProps<MarkdownEditorProps>(), {
	debounce: 500,
	dropHandler: () => false,
});

/**
 * 编辑的文本，从外部修改会导致编辑状态（光标、滚动条等等）重置。
 */
const content = defineModel<string>({ required: true });

const debounced = refDebounced(content, props.debounce);
const editorEl = shallowRef<HTMLElement>();
const previewEl = shallowRef<ComponentPublicInstance>();
const viewMode = shallowRef(ViewMode.Split);
const scrollSynced = shallowRef(true);

const editorRenderer = computed(() => {
	switch (props.renderer) {
		case "rich":
			return rich;
		case "guest":
			return guest;
	}
	return props.renderer;
});

let editor: monaco.editor.IStandaloneCodeEditor;

// 保存当前内容的副本，用于判断 content 是由外部还是这里修改的。
let contentSnapshot = content.value;

const addonContext: AddonContext = <any>{
	options: ref({
		wordWrap: "on",
		minimap: { enabled: false },
	}),
	viewMode,
	scrollSynced,
	text: content,
	selection: shallowRef(new monaco.Selection(0, 0, 0, 0)),
};

createAddonContext(addonContext);

function handleDrop(event: DragEvent) {
	const { files } = event.dataTransfer!;
	if (props.dropHandler(files, addonContext)) {
		return event.preventDefault();
	}
}

watch(addonContext.options, o => editor.updateOptions(o), { deep: true });
watch(viewMode, () => nextTick(() => editor.layout()));
watch(content, value => value !== contentSnapshot && editor.setValue(value));

onUnmounted(() => editor.dispose());

onMounted(() => {
	editor = monaco.editor.create(editorEl.value!, {
		value: content.value,
		language: "markdown",
		// 要写方块字（CJK）的话最好调大点。
		lineHeight: 22,
		fontSize: 16,
		scrollbar: {
			useShadows: false,
		},
		wordSeparators: WORD_SEPARATORS,
		...addonContext.options.value,
	});

	addonContext.editor = editor;

	editor.onDidChangeModelContent(() => {
		content.value = contentSnapshot = editor.getModel()!.getValue(1);
	});

	editor.onDidChangeCursorSelection(e => {
		addonContext.selection.value = e.selection;
	});

	setupScrollSync(editor, previewEl.value!.$el, scrollSynced);
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
	font-size: 14px;
	padding: 0 .5em;
	color: white;
	background-color: #0074e8;
}

/* Ensure editor width controlled by grid */
.editor {
	overflow-x: hidden;
}

.preview {
	padding: 0 12px;
	overflow-y: scroll;
}

.single {
	grid-column: 1/3;
	justify-self: center;

	@media (min-width: 768px) {
		width: 80%;
	}
	@media (min-width: 1200px) {
		width: 900px;
	}
}
</style>
