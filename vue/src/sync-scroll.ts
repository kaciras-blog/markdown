import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

type IScrollEvent = monaco.IScrollEvent;
type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

let editor: IStandaloneCodeEditor;
let preview: HTMLElement;

let lastScrollEditor = false;
let ignoreScroll = false;

export function setupScrollSync(e: IStandaloneCodeEditor, p: HTMLElement) {
	editor = e;
	preview = p;
	editor.onDidScrollChange(syncScrollFromEditor);
}

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
	runScrollAction(() => preview.scrollTop = value);
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
	let previous: HTMLElement | undefined;
	for (const block of preview.children) {
		const attr = block.getAttribute("data-line");
		if (!attr) {
			continue;
		}
		const k = parseInt(attr);
		if (k === i) {
			return [block as HTMLElement];
		} else if (k > i) {
			return [block as HTMLElement, previous];
		}
		previous = block as HTMLElement;
	}
}

function syncScrollFromEditor(event: IScrollEvent) {
	if (!event.scrollTopChanged) {
		return;
	}
	const i = getSourceLineOfHeight(event);
	const pInLine = i - Math.floor(i);
	const elements = getElementsForLine(Math.floor(i));

	console.log(`Line: ${i}, elements:`, elements);
	if (!elements) {
		return setScrollTop(preview, preview.scrollHeight);
	}
	if (elements.length === 1) {
		const c = elements[0]!;
		return setScrollTop(preview, c.offsetTop + c.clientHeight * pInLine - preview.offsetTop);
	}
	const [block, previous] = elements;
	if (!block) {
		return setScrollTop(preview, 0);
	} else {
		const pLine = parseInt(previous!.getAttribute("data-line")!);
		const bLine = parseInt(block.getAttribute("data-line")!);
		const progress = (i - pLine) / (bLine - pLine);
		const pEnd = previous!.classList.contains("hljs")
			? previous!.offsetTop
			: previous!.clientHeight + previous!.offsetTop;
		return setScrollTop(preview, pEnd + (block.offsetTop - pEnd) * progress - preview.offsetTop);
	}
}
