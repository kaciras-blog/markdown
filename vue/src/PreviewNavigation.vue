<template>
	<aside :class='$style.navigation' aria-label='文档导航' ref='navEl'>
		<button
			v-for='(item, i) in headings'
			:key='item.id'
			type='button'
			:class='$style.link'
			:data-index='i'
			:style='{ paddingLeft: `${Number(item.tagName.slice(1)) * 12}px` }'
			:aria-current='activeIndex === i ? "true" : undefined'
			@click='scrollToHeading'
		>
			<!-- slice(0, -2) 去掉锚点的# -->
			{{ item.textContent.slice(0, -2) }}
		</button>
		<p v-if='headings.length === 0' :class='$style.empty'>当前预览没有标题</p>
	</aside>
</template>

<script setup lang='ts'>
import { ComponentPublicInstance, computed, nextTick, onBeforeUnmount, shallowRef, watch } from "vue";

interface PreviewNavigationProps {
	content: string;
	previewRoot?: ComponentPublicInstance | null;
}

const props = defineProps<PreviewNavigationProps>();

const navEl = shallowRef<HTMLElement>();
const headings = shallowRef<HTMLElement[]>([]);
const activeIndex = shallowRef(0);

let observer: IntersectionObserver | null = null;

const previewElement = computed(() => props.previewRoot?.$el as HTMLElement | undefined);

function collectHeadings() {
	const root = previewElement.value;
	if (!root) {
		headings.value = [];
		observer?.disconnect();
		return;
	}

	headings.value = Array
		.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"))
		.filter(node => node.id);

	observer?.disconnect();

	const list = headings.value;
	if (!list.length) {
		return;
	}

	observer = new IntersectionObserver(intersect, {
		root: previewElement.value,
		rootMargin: "-48px 0px -75% 0px",
		threshold: [0, 0.2, 0.5, 1],
	});

	for (const item of list) {
		observer.observe(item);
	}

	const anchorTop = root.getBoundingClientRect().top + 48;
	let current = 0;
	for (let i = 0; i < list.length; i++) {
		if (list[i].getBoundingClientRect().top <= anchorTop) {
			current = i;
		} else {
			break;
		}
	}
	activeIndex.value = current;
}

function scrollToHeading(event: MouseEvent) {
	const i = parseInt((event.target as HTMLElement).dataset.index as string);
	activeIndex.value = i;
	headings.value[i].scrollIntoView({ behavior: "smooth", block: "start" });
}

function intersect(entries: IntersectionObserverEntry[]) {
	const visibleHeadings = new Set<string>();

	for (const entry of entries) {
		const id = entry.target.id;
		if (!id) {
			continue;
		}
		if (entry.isIntersecting) {
			visibleHeadings.add(id);
		}
	}

	if (visibleHeadings.size) {
		activeIndex.value = headings.value.findIndex(item => visibleHeadings.has(item.id));
	}
}

function scrollToActiveButton() {
	const nodes = navEl.value!.querySelectorAll("button");
	nodes[activeIndex.value]?.scrollIntoView({ block: "nearest" });
}

watch(previewElement, () => nextTick(collectHeadings), { immediate: true });

watch(() => props.content, () => nextTick(collectHeadings), { flush: "post" });

watch(activeIndex, () => nextTick(scrollToActiveButton), { flush: "post" });

onBeforeUnmount(() => observer?.disconnect());
</script>

<style module>
.navigation {
	display: flex;
	flex-direction: column;
	padding: 16px 12px;
	row-gap: 4px;

	overflow-y: auto;
	background-color: whitesmoke;
}

.link {
	width: 100%;
	padding: 8px;

	border: none;
	background: none;

	text-align: left;
	font-size: 0.8em;

	color: #1f2328;
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.link:hover,
.link:focus-visible {
	background-color: rgba(15, 76, 129, 0.12);
	outline: none;
}

.link[aria-current="true"] {
	background-color: rgba(90, 172, 230, 0.14);
	color: #0074e8;
	font-weight: 600;
}

.empty {
	margin: 0;
	font-size: 12px;
	color: #909090;
}
</style>
