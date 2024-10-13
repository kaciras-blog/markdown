import type MarkdownIt from "markdown-it";
import CopyIcon from "bootstrap-icons/icons/clipboard.svg?raw";
import CopiedIcon from "bootstrap-icons/icons/clipboard-check.svg?raw";

function extractDiff(code: string) {
	// 遍历每一行，记录以差分符号（+/-）开头的行号。
	const lines = code.trim().split("\n");
	const changes = new Map<number, boolean>();

	for (let i = 0; i < lines.length; i++) {
		switch (lines[i].charCodeAt(0)) {
			case 43: /* + */
				changes.set(i, true);
				break;
			case 45: /* - */
				changes.set(i, false);
				break;
			default:
				continue;
		}
		// 去掉差分符号使 highlight.js 能够处理。
		lines[i] = lines[i].slice(1);
	}

	let rowsBackground = "<div class='overlay'>";
	for (const [i, type] of changes) {
		const suffix = type ? "insert" : "delete";
		rowsBackground += `<div class='hljs-${suffix}' style='grid-row: ${i + 1}'></div>`;
	}

	// 去除了差分符号后的代码给下层高亮库处理。
	return {
		content: lines.join("\n"),
		background: rowsBackground + "</div>",
	};
}

/**
 * 自定义代码块的插件，因为 MarkdownIt 默认最外层是 pre，限制了扩展性，所以本项目替换了它。
 * https://github.com/markdown-it/markdown-it/blob/13.0.2/lib/renderer.js#L58
 *
 * # 标签的选择
 * [HTML 标准文档](https://html.spec.whatwg.org/#the-code-element)中的第二个
 * 示例使用了 pre 和 code 两个标签包裹代码块，这被许多人视为推荐的做法。
 *
 * 但实际上文档中本没有 Recommend 或 Should 等字眼，它仅是一个示例而已。
 * [这里也有讨论](https://stackoverflow.com/q/11742907/7065321)
 *
 * 为了性能和可调试性，应当减少 DOM 中元素的层级，所以这里选择仅用一个标签。
 * 考虑到存在非代码，但又要格式化的文本，选择 pre 比 code 更通用，GitHub 也是如此。
 */
export default function (md: MarkdownIt) {
	const { unescapeAll, escapeHtml } = md.utils;
	const highlight = md.options.highlight ?? escapeHtml;

	md.renderer.rules.fence = (tokens, idx, _, __, self) => {
		const token = tokens[idx];
		let { content } = token;
		let background = "";

		const [language, attrs = ""] = unescapeAll(token.info).split(/\s+/g, 2);
		if (attrs === "diff") {
			const tuple = extractDiff(content);
			content = tuple.content;
			background = tuple.background;
		}

		const codeHTML = highlight(content, language, attrs);
		token.attrJoin("class", "hljs");
		const wrapperAttrs = self.renderAttrs(token).trimStart();

		// 因为标题栏跟内容不同步滚动，所以不能直接拿最外层做层叠容器。
		if (language) {
			return $HTML`
				<div ${wrapperAttrs}>
					<div class='code-meta'>
						${language}
						<button class='copy'>
							${CopyIcon}Copy
						</button>
					</div>
					<pre class='stack-view'>
						${background}
						<div class='code'>${codeHTML}</div>
					</pre>
				</div>
			`;
		} else {
			return `<pre ${wrapperAttrs}>${codeHTML}</pre>`;
		}
	};
}

// Copy 是个很常见的单词，谁都看得懂，就不做本地化了。
async function handleCopy(event: Event) {
	const button = event.currentTarget as HTMLButtonElement;
	const pre = button.parentNode!.parentNode!.lastElementChild!;
	await navigator.clipboard.writeText(pre.textContent!);

	button.disabled = true;
	button.innerHTML = `${CopiedIcon}Copy`;
}

function handleMouseLeave(event: Event) {
	const button = event.currentTarget as HTMLButtonElement;
	button.disabled = false;
	button.innerHTML = `${CopyIcon}Copy`;
}

/**
 * 实现点击按钮复制代码。考虑到代码一行可能很长，以及手机端框选困难，这个功能还是要有的。
 *
 * @param root 由 fencePlugin 渲染出的元素。
 */
export function activateCopyButtons(root: HTMLElement) {
	for (const button of root.querySelectorAll(".copy")) {
		(button as HTMLButtonElement).onclick = handleCopy;
		(button as HTMLButtonElement).onmouseleave = handleMouseLeave;
	}
}
