declare global {
	// Processed by Vite, see ../html-string.ts
	const $HTML: (..._: unknown[]) => string;
}

export {}; // 不加这个就无法识别上面添加的全局模块。
