import { Ref, watch } from "vue";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

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
		if (ignoreScroll || !enabled.value) {
			return;
		}
		ignoreScroll = true;
		requestAnimationFrame(() => {
			callback();
			requestAnimationFrame(() => ignoreScroll = false);
		});
	}

	function scrollEditor(top: number) {
		runScrollAction(() => editor.setScrollTop(top, 1));
	}

	function scrollPreview(top: number) {
		runScrollAction(() => preview.scrollTop = top - preview.offsetTop);
	}

	watch(enabled, value => {
		if (value) {
			lastScrollEditor
				? scrollPreviewByEditor(editor.getScrollTop())
				: scrollEditorByPreview(preview.offsetTop);
		}
	});

	ensureLineCache();

	const obs = new MutationObserver(ensureLineCache);
	obs.observe(preview, { childList: true, subtree: true });
	editor.onDidDispose(() => obs.disconnect());

	/**
	 * 扫描并缓存渲染结果及其对应的行号，在每次内容更改后都需要重新生成该缓存。
	 * 因为滚动相比于编辑更频繁，常见情况是停下来看看前后文，所以缓存是有意义的。
	 */
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

	function getElementsAtPosition(position: number) {
		const entries = lineCache.filter(i => i.el.offsetParent);
		let [lo, hi] = [0, entries.length - 1];
		while (lo <= hi) {
			const mid = Math.floor((lo + hi) / 2);
			const { top, bottom } = entries[mid].el.getBoundingClientRect();
			if (position > bottom) {
				lo = mid + 1;
			} else if (position < top) {
				hi = mid - 1;
			} else {
				return [entries[mid]]; // 在元素之内
			}
		}
		if (lo === 0) {
			return [undefined, undefined]; // 在第一个之前
		}
		if (lo >= lineCache.length) {
			return; // 超过最后的元素
		}
		return [entries[hi], entries[lo]]; // 在两个之间
	}

	function getElementsForLine(line: number) {
		let [lo, hi] = [0, lineCache.length - 1];
		while (lo <= hi) {
			const mid = Math.floor((lo + hi) / 2);
			const { start, end } = lineCache[mid];
			if (line > end) {
				lo = mid + 1;
			} else if (line < start) {
				hi = mid - 1;
			} else {
				return [lineCache[mid]]; // 在元素之内
			}
		}
		if (lo === 0) {
			return [undefined, undefined]; // 在第一个之前
		}
		if (lo >= lineCache.length) {
			return; // 超过最后的元素
		}
		return [lineCache[hi], lineCache[lo]]; // 在两个之间
	}

	preview.addEventListener("scroll", () => {
		lastScrollEditor = false;
		scrollEditorByPreview(preview.offsetTop);
	});

	function scrollEditorByPreview(offset: number) {
		const elements = getElementsAtPosition(offset);
		if (!elements) {
			return scrollEditor(Infinity);
		}
		const [previous, entry] = elements;
		if (!previous) {
			return scrollEditor(0);
		}
		const r = previous.el.getBoundingClientRect();
		if (elements.length === 1) {
			const progress = (offset - r.top) / r.height;
			sLine(previous.start + progress * (previous.end - previous.start));
		} else {
			const n = entry!.el.getBoundingClientRect();
			const progress = (offset - r.bottom) / (n.top - r.bottom);
			sLine(previous.end + progress * (entry!.start - previous.end));
		}
	}

	function sLine(line: number) {
		line++;
		const i = Math.floor(line);
		const s = editor.getTopForLineNumber(i);
		const e = editor.getTopForLineNumber(i + 1);
		return scrollEditor(s + (line - i) * (e - s));
	}

	function getSourceLineOfHeight(top: number) {
		const model = editor.getModel()!;

		let i = model.getLineCount();
		let p = 0;
		for (; i > 0; i--) {
			const t = editor.getTopForLineNumber(i);
			if (t <= top) {
				p = (top - t) / (editor.getTopForLineNumber(i + 1) - t);
				break;
			}
		}
		return i - 1 + p;
	}

	/**
	 * 这里计算高度差使用 getBoundingClientRect 而不是 offsetTop，因为表格内元素的
	 * offsetParent 是表格本身，即使它没设置 position，这应该是遗留问题。
	 *
	 * https://drafts.csswg.org/cssom-view/#dom-htmlelement-offsetparent
	 */
	editor.onDidScrollChange(event => {
		if (!enabled.value || !event.scrollTopChanged) {
			return;
		}
		lastScrollEditor = true;
		scrollPreviewByEditor(event.scrollTop);
	});

	function scrollPreviewByEditor(offset: number) {
		const i = getSourceLineOfHeight(offset);
		const elements = getElementsForLine(i);

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
	}

	function scrollPreviewToProgress(entry: LineCacheEntry) {
		const { el, start, end } = entry;
		const ss = editor.getTopForLineNumber(start + 1);
		const se = editor.getTopForLineNumber(end + 1);
		const progress = (editor.getScrollTop() - ss) / (se - ss);
		const { height, top } = el.getBoundingClientRect();
		return scrollPreview(height * progress + top + preview.scrollTop);
	}

	if (import.meta.env.MODE !== "lib") {
		window.$debug = { scrollEditorByPreview, scrollPreviewByEditor };
	}
}

declare global {

	interface DebugManager {
		scrollEditorByPreview(offset: number): void;

		scrollPreviewByEditor(offset: number): void;
	}

	// noinspection JSUnusedGlobalSymbols
	interface Window { $debug: DebugManager }
}
