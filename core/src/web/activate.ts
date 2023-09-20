import { activateCopyButtons } from "./fence.js";
import observeLazyLoad, { LazyLoadOptions } from "./lazy-loading.js";

export { LazyLoadOptions };

/**
 * 激活 Markdown 元素，其实就是添加各种监听。返回一个清理函数，卸载组件后记得调用哦。
 *
 * @param el 容器元素，监听将应用到它的下级元素。
 * @param options 懒加载选项
 * @return 取消监听的函数，必须在被监视的元素移除后调用，以避免内存泄漏。
 */
export function activate(el: HTMLElement, options: LazyLoadOptions = {}) {
	activateCopyButtons(el);
	return observeLazyLoad(el, options);
}
