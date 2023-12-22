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
			:renderer='renderer'
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

<script lang='ts'>
import * as md from "monaco-editor/esm/vs/basic-languages/markdown/markdown.js";

// 给自定义的两个语法 TOC 和 Directive 添加解析支持。
const { tokenizer } = md.language;
tokenizer.root.unshift([/^(\[\[TOC]])/, ["keyword.toc"]]);
tokenizer.root.unshift([
	/^(@\w+)(!?\[)((?:[^\]\\]|@escapes)*)(]\([^)]+\))/,
	["type.directive", "string.link", "", "string.link"],
]);
</script>

<script setup lang='ts'>
import { ComponentPublicInstance, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { refDebounced, useVModel } from "@vueuse/core";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js";
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles.js";
import "monaco-editor/esm/vs/editor/contrib/wordOperations/browser/wordOperations.js";
import "monaco-editor/esm/vs/editor/contrib/linesOperations/browser/linesOperations.js";
import "monaco-editor/esm/vs/editor/contrib/dnd/browser/dnd.js";
import "monaco-editor/esm/vs/editor/contrib/multicursor/browser/multicursor.js";
import MarkdownView, { Renderer } from "./MarkdownView.vue";
import { AddonContext, createAddonContext, ViewMode } from "./addon-api.ts";

/*
 * TODO: 如果不导出 props 的类型则构建时会报错:
 *       Default export of the module has or is using private name.
 *       而且导出的成员必须放在最前，这是什么奇怪的规则？
 */

/**
 * TODO: monaco 默认光标不随拖拽而移动，dnd 插件没有公开 API，插入点会有问题。
 *
 * @param files 拖放到编辑器的文件列表
 * @param ctx 编辑器上下文
 * @return true 表示已经处理完成，无需再执行默认的行为。
 */
export type DropHandler = (files: FileList, ctx: AddonContext) => boolean | void;

export interface MarkdownEditorProps {
	/**
	 * 文本内容，目前还不支持从外部修改此属性。
	 */
	modelValue: string;

	/**
	 * Markdown 渲染器，可以为 MarkdownIt 的实例。
	 * 如果是字符串则使用 @kaciras-blog/markdown/presets 里对应的。
	 *
	 * @default "guest"
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

const WORD_SEPARATORS =
	'`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?'	// USUAL_WORD_SEPARATORS
	+ "·！￥…*（）—【】：；‘’“”、《》，。？"	// 中文符号。
	+ "「」｛｝＜＞・～＠＃＄％＾＆＊＝『』";	// 日韩符号，去除了跟中文重复的。

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
		const { offsetHeight } = editorEl.value!;
		const { $el } = previewEl.value!;
		const p = $el.scrollTop / ($el.scrollHeight - offsetHeight);

		// Monaco-editor 在末尾有一屏的空白，所以要多减去一个 offsetHeight。
		const max = editor.getScrollHeight() - offsetHeight * 2;

		/*
		 * 当右侧滚到底时，如果左侧位置超过了内容（即在空白区），就不滚动。
		 * 这样做是为了避免删除最后一页的行时，编辑区滚动位置抖动的问题。
		 */
		if (p < 0.999) {
			editor.setScrollTop(p * max);
		} else if (editor.getScrollTop() < max) {
			editor.setScrollTop(max);
		}
	});
}

function scrollPreviewToEditor() {
	lastScrollEditor = true;
	runScrollAction(() => {
		const scrollHeight = editor.getScrollHeight();
		const { offsetHeight } = editorEl.value!;
		const { $el } = previewEl.value!;

		/*
		 * 没超过一屏就不滚动，因为结果可能长于 Markdown（反之好像不会），
		 * 此时换行会让 HTML 视图滚到顶而不是保持在当前位置。
		 */
		if (scrollHeight < offsetHeight * 2) {
			return;
		}
		const p = editor.getScrollTop() / (scrollHeight - offsetHeight * 2);
		$el.scrollTop = p * ($el.scrollHeight - offsetHeight);
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
		// 太挤看得累，增大点，跟我的 VSCode 一致。
		lineHeight: 22,
		fontSize: 16,
		// 光标所在的句子（双击会选中的）不高亮。
		occurrencesHighlight: "off",
		scrollbar: {
			useShadows: false,
		},
		wordSeparators: WORD_SEPARATORS,
		// Markdown 标记很少，就不高亮易混淆字符了。
		unicodeHighlight: {
			ambiguousCharacters: false,
		},
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
