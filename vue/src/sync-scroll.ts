import type { Ref } from "vue";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

type IScrollEvent = monaco.IScrollEvent;
type Editor = monaco.editor.IStandaloneCodeEditor;

interface LineCacheEntry {
	start: number;
	end: number;
	el: HTMLElement;
}

function parseDataLine(el: Element) {
	return el.getAttribute("data-line")!.split(",").map(Number);
}

/**
 * 绑定同步滚动，精确到块元素和源文本对应的行。Markdown 渲染器需要添加 sourceLine 插件。
 *
 * @param editor Monaco Editor 实例。
 * @param preview 预览区。
 * @param enabled 用于切换同步的开关。
 */
export default function (editor: Editor, preview: HTMLElement, enabled: Ref<boolean>) {
	let lastScrollEditor = false;
	let ignoreScroll = false;
	let cacheVersion: number;
	let lineCache: LineCacheEntry[];

	// 加锁避免循环触发滚动事件，同时延迟到下一帧解决浏览器的平滑滚动问题。
	function runScrollAction(callback: () => void) {
		if (ignoreScroll) {
			return;
		}
		ignoreScroll = true;
		requestAnimationFrame(() => {
			callback();
			requestAnimationFrame(() => ignoreScroll = false);
		});
	}

	function scrollEditor(scrollTop: number) {
		runScrollAction(() => editor.setScrollTop(scrollTop, 1));
	}

	function scrollPreview(value: number) {
		runScrollAction(() => preview.scrollTop = value - preview.offsetTop);
	}

	function ensureLineCache() {
		const version = editor.getModel()!.getVersionId();
		if (version === cacheVersion) {
			return;
		}
		cacheVersion = version;
		lineCache = [];
		for (const el of preview.querySelectorAll("*[data-line]")) {
			const [start, end] = parseDataLine(el);
			lineCache.push({ start, end, el } as LineCacheEntry);
		}
	}

	function getElementsAtPosition(top: number) {
		ensureLineCache();
		let previous;
		for (const entry of lineCache) {
			const rect = entry.el.getBoundingClientRect();
			if (rect.top >= top) {
				return [previous, entry];
			}
			previous = entry;
		}
	}

	preview.addEventListener("scroll", () => {
		const offset = preview.offsetTop;
		const elements = getElementsAtPosition(offset);

		console.log(`Offset: ${offset}, elements:`, elements);
		if (!elements) {
			return;
		}
		const [previous, entry] = elements;
		if (!previous) {
			return scrollEditor(0);
		}
		const r = previous.el.getBoundingClientRect();
		if (offset <= r.top + r.height) {
			const progress = (offset - r.top) / r.height;
			sLine(previous.start + progress * (previous.end - previous.start));
		} else if (entry) {
			const n = entry.el.getBoundingClientRect();
			const progress = (offset - r.bottom) / (n.top - r.bottom);
			sLine(previous.end + progress * (entry.start - previous.end));
		} else {
			return scrollEditor(Infinity);
		}
	});

	function sLine(line: number) {
		line++;
		const i = Math.floor(line);
		const s = editor.getTopForLineNumber(i);
		const e = editor.getTopForLineNumber(i + 1);
		return scrollEditor(s + (line - i) * (e - s));
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


	function getElementsForLine(i: number) {
		ensureLineCache();
		let previous;
		for (const entry of lineCache) {
			if (entry.start === i) {
				return [entry];
			} else if (entry.start > i) {
				return [previous, entry];
			}
			previous = entry;
		}
	}

	editor.onDidScrollChange(event => {
		if (!enabled.value || !event.scrollTopChanged) {
			return;
		}
		const i = getSourceLineOfHeight(event);
		const elements = getElementsForLine(Math.floor(i));
		// console.log(`Line: ${i}, elements:`, elements);

		// 所有元素都再当前行之前，通常是编辑器底部的空白区，直接滚到最底下。
		if (!elements) {
			return scrollPreview(preview.scrollHeight);
		}
		const [previous, next] = elements;

		// 第一个元素都在当前行之后，直接滚到顶上。
		if (!previous) {
			return scrollPreview(0);
		}

		// 特殊情况：元素可能在收起的折叠块内。
		let parent = previous.el;
		let topMostCollapsible;
		while (parent !== preview) {
			if (parent.tagName === "DETAILS" && !(parent as any).open) {
				topMostCollapsible = parent;
			}
			parent = parent!.parentElement!;
		}
		if (topMostCollapsible) {
			const [start, end] = parseDataLine(topMostCollapsible);
			return scrollPreviewToProgress({ start, end, el: topMostCollapsible });
		}

		// 当前行有对应的元素，直接滚到元素内即可。
		if (elements.length === 1 || i <= previous.end) {
			return scrollPreviewToProgress(previous);
		}

		// 当前行在两个元素之间，那就滚动到中间的间隔区域。
		const pLine = previous.end;
		const bLine = next!.start;
		const progress = (i - pLine) / (bLine - pLine);
		const pr = previous.el.getBoundingClientRect();
		const nr = next!.el.getBoundingClientRect();
		return scrollPreview(pr.bottom + (nr.top - pr.bottom) * progress + preview.scrollTop);
	});

	function scrollPreviewToProgress(entry: LineCacheEntry) {
		const { el, start, end } = entry;
		const ss = editor.getTopForLineNumber(start + 1);
		const se = editor.getTopForLineNumber(end + 1);
		const progress = (editor.getScrollTop() - ss) / (se - ss);
		const { height, top } = el.getBoundingClientRect();
		return scrollPreview(height * progress + top + preview.scrollTop);
	}
}
