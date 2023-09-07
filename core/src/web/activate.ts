import { activateCopyButtons } from "./fence.js";
import { observeLazyLoad } from "./lazy-loading.js";

/**
 * 激活 Markdown 元素，其实就是添加各种监听。返回一个清理函数，卸载组件后记得调用哦。
 */
export function activate(el: HTMLElement) {
	activateCopyButtons(el);
	return observeLazyLoad(el);
}
