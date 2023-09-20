import { activateCopyButtons } from "./fence.js";
import observeLazyLoad, { LazyLoadOptions } from "./lazy-loading.js";

/**
 * 激活 Markdown 元素，其实就是添加各种监听。返回一个清理函数，卸载组件后记得调用哦。
 *
 * @return 取消监听的函数，必须在被监视的元素移除后调用，以避免内存泄漏。
 */
export function activate(el: HTMLElement, options: LazyLoadOptions = {}) {
	activateCopyButtons(el);
	return observeLazyLoad(el, options);
}
