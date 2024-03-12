import { Ref } from "vue";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

type IScrollEvent = monaco.IScrollEvent;
type Editor = monaco.editor.IStandaloneCodeEditor;

interface LineCacheEntry {
	start: number;
	end: number;
	el: HTMLElement;
}

export default function (editor: Editor, preview: HTMLElement, enabled: Ref<boolean>) {
	let lastScrollEditor = false;
	let ignoreScroll = false;

	editor.onDidScrollChange(syncScrollFromEditor);

	function runScrollAction(callback: () => void) {
		if (ignoreScroll) {
			return;
		}
		ignoreScroll = true;

		// Must delay to the next frame if the user uses smooth scrolling.
		requestAnimationFrame(() => {
			callback();
			requestAnimationFrame(() => ignoreScroll = false);
		});
	}

	function setScrollTop(preview: HTMLElement, value: number) {
		runScrollAction(() => preview.scrollTop = value - preview.offsetTop);
	}

	function getSourceLineOfHeight(event: IScrollEvent) {
		const height = event.scrollTop;
		const model = editor.getModel()!;

		let i = model.getLineCount();
		let p = 0;
		for (; i > 0; i--) {
			const t = editor.getTopForLineNumber(i);
			if (t <= height) {
				p = (height - t) / (editor.getTopForLineNumber(i + 1) - t);
				break;
			}
		}
		return i - 1 + p;
	}


	let cacheVersion: number;
	let lineCache: LineCacheEntry[];

	function getElementLines() {
		const version = editor.getModel()!.getVersionId();
		if (version !== cacheVersion) {
			buildLineCache();
			cacheVersion = version;
		}
		return lineCache;
	}

	function buildLineCache() {
		lineCache = [];
		for (const el of preview.querySelectorAll("*[data-line]")) {
			const [start, end] = el.getAttribute("data-line")!
				.split(",")
				.map(Number);
			lineCache.push({ start, end, el } as LineCacheEntry);
		}
	}

	function getElementsForLine(i: number) {
		let previous;
		for (const entry of getElementLines()) {
			if (entry.start === i) {
				return [entry];
			} else if (entry.start > i) {
				return [previous, entry];
			}
			previous = entry;
		}
	}

	function syncScrollFromEditor(event: IScrollEvent) {
		if (!enabled.value || !event.scrollTopChanged) {
			return;
		}
		const i = getSourceLineOfHeight(event);
		const pInLine = i - Math.floor(i);
		const elements = getElementsForLine(Math.floor(i));
		console.log(`Line: ${i}, elements:`, elements);

		// 所有元素都再当前行之前，通常是编辑器底部的空白区，直接滚到最底下。
		if (!elements) {
			return setScrollTop(preview, preview.scrollHeight);
		}
		const [previous, next] = elements;

		// 第一个元素都在当前行之后，直接滚到顶上。
		if (!previous) {
			return setScrollTop(preview, 0);
		}

		// 特殊情况-1：代码块内部由高亮库渲染，无法打标记，直接按比例滚动。
		if (previous.el.classList.contains("hljs")) {
			const ss = editor.getTopForLineNumber(previous.start + 1);
			const se = editor.getTopForLineNumber(previous.end + 1);
			const progress = (event.scrollTop - ss) / (se - ss);
			const pEnd = previous!.el.clientHeight * progress + previous!.el.offsetTop;
			return setScrollTop(preview, pEnd);
		}

		// 特殊情况-2：元素可能在收起的折叠块内。
		let parent = previous.el;
		let topMostCollapsible;
		while (parent !== preview) {
			if (parent.tagName === "DETAILS" && !(parent as any).open) {
				topMostCollapsible = parent;
			}
			parent = parent!.parentElement!;
		}
		if (topMostCollapsible) {
			const [start, end] = topMostCollapsible.getAttribute("data-line")!
				.split(",")
				.map(Number);
			const ss = editor.getTopForLineNumber(start + 1);
			const se = editor.getTopForLineNumber(end + 1);
			const progress = (event.scrollTop - ss) / (se - ss);
			const pEnd = topMostCollapsible.clientHeight * progress + topMostCollapsible.offsetTop;
			return setScrollTop(preview, pEnd);
		}

		// 当前行有对应的元素，直接滚到元素内即可。
		if (elements.length === 1 || i <= previous.end) {
			return scrollPreviewToProgress(previous);
		}

		// 当前行在两个元素之间，那就滚动到中间的间隔区域。
		const pLine = previous.start;
		const bLine = next!.start;
		const progress = (i - pLine) / (bLine - pLine);
		const pEnd = previous!.el.clientHeight + previous!.el.offsetTop;
		return setScrollTop(preview, pEnd + (next!.el.offsetTop - pEnd) * progress);
	}

	function scrollPreviewToProgress(entry: LineCacheEntry) {
		const { el, start, end } = entry;
		const ss = editor.getTopForLineNumber(start + 1);
		const se = editor.getTopForLineNumber(end + 1);
		const progress = (editor.getScrollTop() - ss) / (se - ss);
		return setScrollTop(preview, el.clientHeight * progress + el.offsetTop);
	}
}
