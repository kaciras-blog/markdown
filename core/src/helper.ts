export enum Emphasis {
	None = 0,
	Italic = 1,
	Bold = 2,
	Code = 4,
	StrikeThrough = 8,
}

/**
 * 搜索一段文本所有的强调，强调是指两端具有对称字符的语法，如 **bold**, `code` 等等。
 *
 * @return [强调类型, 强调字符串的长度] 二元组。
 * @example
 * getEmphasis("`**text**`") // [Emphasis.Bold | Emphasis.Code, 3]
 */
export function getEmphasis(text: string): [Emphasis, number] {
	let emphasis = Emphasis.None;
	let i = 0;
	let k = text.length - 1;
	let repeat = 0;
	let prev = text.charCodeAt(0);

	if (k < 1) {
		return [Emphasis.None, 0]; // 长度不足 2 的肯定没有强调。
	}

	// 通过前一个字符 prev 和它重复的次数 repeat 来判断强调的类型。
	function check(): Emphasis {
		if (repeat === 0) {
			return Emphasis.None;
		}
		if (prev === 126 /* ~ */ && repeat === 2) {
			return Emphasis.StrikeThrough;
		}
		if (prev === 96 /* ` */) {
			return Emphasis.Code;
		}
		if (prev !== 42 /* * */ && prev !== 95 /* _ */) {
			return Emphasis.None;
		}
		if (repeat === 1) {
			return Emphasis.Italic;
		}
		if (repeat === 2) {
			return Emphasis.Bold;
		}
		return Emphasis.Bold | Emphasis.Italic;
	}

	for (; i < k; i++, k--, repeat++) {
		const c = text.charCodeAt(i);
		if (c !== text.charCodeAt(k)) {
			break; // 前后对称位置的字符不一样。
		}
		if (c !== prev) {
			const w = check();
			if (w === Emphasis.None) {
				break;
			}
			repeat = 0;
			prev = c;
			emphasis |= w;
		}
	}

	// 如果前面字符串的不是有效的强调，则要把长度回退到最后一个。
	const w = check();
	return [emphasis | w, w === Emphasis.None ? i - repeat : i];
}
