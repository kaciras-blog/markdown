import { identity, silencePromise } from "@kaciras/utilities/browser";

/**
 * 检测浏览器支持的新一代视频编码，新一代指在 H.264 之后，压缩率更好且受到广泛支持的。
 *
 * [查看浏览器支持哪些](https://cconcolato.github.io/media-mime-support)
 * [查询字符串的选择](https://evilmartians.com/chronicles/better-web-video-with-av1-codec)
 *
 * @return 以逗号隔开的字符串，包含所支持的编码，该值会缓存下来。
 */
function detectSupportedVideoCodecs() {
	// 只有 iPhone 可能不支持 MediaSource，它可以解码 HEVC。
	if (!("MediaSource" in window)) {
		return ["hevc"];
	}

	// 待测的编码列表，靠前的更先进，也具有更高的优先级。
	const codecMap: Array<[string, string]> = [
		["av1", "video/mp4; codecs=av01.0.05M.08"],
		["hevc", "video/mp4; codecs=hvc1"],
	];

	/*
	 * HTMLMediaElement.canPlayType() 在未安装插件的 Edge 里返回 "probably"，但实际上无法播放。
	 * 另外也可以用 navigator.mediaCapabilities()，不过参数略复杂。
	 */
	return codecMap
		.filter(c => MediaSource.isTypeSupported(c[1]))
		.map(c => c[0]);
}

export type LazyElement = HTMLMediaElement | HTMLImageElement;

export type LazyLoadOptions = IntersectionObserverInit & {

	/**
	 * 触发懒加载时根据原始 URL 返回要加载的 URL，默认原样返回。
	 *
	 * 该函数设计为使用客户端才能获得的信息来调整资源的 URL，如检测支持的编码。
	 *
	 * @param src 原始的 URL。
	 * @param type 资源的类型，是 IMG, VIDEO, AUDIO 三者之一。
	 */
	getURL?: (src: string, type: string) => string;
}

/**
 * 对指定容器内的媒体元素（由 ./media.ts 渲染）启用懒加载，该函数只能在浏览器端调用。
 *
 * 【Reader View 兼容性】
 * JS 实现的懒加载在浏览器的阅读视图里无法工作，唯一的方案是用 loading="lazy"，
 * 但兼容性还不行，故不建议使用阅读视图浏览。
 */
export default function (root: HTMLElement, options: LazyLoadOptions) {
	const { getURL = identity } = options;

	function onEnter(el: LazyElement) {
		const { dataset } = el;

		if (dataset.src) {
			el.src = getURL(dataset.src, el.tagName);
			delete dataset.src;
		}

		/*
		 * play() 返回 Promise 来加等待加载完成，如果元数据还未加载完就暂停会抛出异常。
		 * 在 Chrome 里是 AbortError，Firefox 是 DomException，无法很好地跟其他情况区分。
		 *
		 * 但元数据的加载被中断是正常的，不影响下次播放，故直接屏蔽掉。
		 *
		 * https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
		 */
		if (el.classList.contains("gif")) {
			silencePromise((el as HTMLVideoElement).play());
		}
	}

	function onLeave(el: LazyElement) {
		if (el.classList.contains("gif")) {
			(el as HTMLVideoElement).pause();
		}
	}

	function callback(entries: IntersectionObserverEntry[]) {
		for (const e of entries) {
			if (e.isIntersecting) {
				onEnter(e.target as LazyElement);
			} else {
				onLeave(e.target as LazyElement);
			}
		}
	}

	const observer = new IntersectionObserver(callback, options);
	for (const e of root.querySelectorAll("img,video,audio")) {
		observer.observe(e);
	}
	return observer.disconnect.bind(observer);
}
