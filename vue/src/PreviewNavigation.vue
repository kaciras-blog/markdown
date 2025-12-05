<template>
	<aside :class='$style.navigation' aria-label='文档导航'>
		<h2 :class='$style.title'>目录</h2>
		<div
			v-if='headings.length'
			:class='$style.list'
			ref='listEl'
		>
			<button
				v-for='item in headings'
				:key='item.id'
				type='button'
				:class='[
					$style.link,
					activeHeadingId === item.id && $style.active,
				]'
				:data-id='item.id'
				:style='{ paddingLeft: `${item.level * 12}px` }'
				:aria-current='activeHeadingId === item.id ? "true" : undefined'
				@click='scrollToHeading(item)'
			>
				{{ item.title }}
			</button>
		</div>
		<p v-else :class='$style.empty'>当前预览没有标题</p>
	</aside>
</template>

<script setup lang='ts'>
import { ComponentPublicInstance, computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";

interface HeadingItem {
	id: string;
	title: string;
	level: number;
	el: HTMLElement;
}

interface PreviewNavigationProps {
	content: string;
	previewRoot?: ComponentPublicInstance | null;
}

const props = defineProps<PreviewNavigationProps>();

const headings = shallowRef<HeadingItem[]>([]);
const activeHeadingId = ref("");
const listEl = ref<HTMLUListElement>();
const observer = shallowRef<IntersectionObserver>();
const visibleHeadings = new Set<string>();

const previewElement = computed(() => props.previewRoot?.$el as HTMLElement | undefined);

function collectHeadings() {
	const root = previewElement.value;
	if (!root) {
		headings.value = [];
		activeHeadingId.value = "";
		teardownObserver();
		return;
	}

	const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"));
	headings.value = nodes
		.filter(node => node.id)
		.map(element => ({
			id: element.id,
			title: element.textContent.slice(0, -2), // 去掉锚点的#
			el: element,
			level: Number(element.tagName.slice(1)),
		}));

	observer.value?.disconnect();
	visibleHeadings.clear();

	const list = headings.value;

	if (!list.length) {
		activeHeadingId.value = "";
		return;
	}

	observer.value = new IntersectionObserver(handleIntersections, {
		root: previewElement.value,
		rootMargin: "-48px 0px -75% 0px",
		threshold: [0, 0.2, 0.5, 1],
	});

	for (const item of list) {
		observer.value.observe(item.el);
	}

	updateActiveHeading();
	nextTick(scrollToActiveButton);
}

function teardownObserver() {
	observer.value?.disconnect();
}

function scrollToHeading(item: HeadingItem) {
	item.el.scrollIntoView({ behavior: "smooth", block: "start" });
	activeHeadingId.value = item.id;
}

function handleIntersections(entries: IntersectionObserverEntry[]) {
	let changed = false;
	for (const entry of entries) {
		const id = entry.target.id;
		if (!id) {
			continue;
		}
		if (entry.isIntersecting) {
			if (!visibleHeadings.has(id)) {
				visibleHeadings.add(id);
				changed = true;
			}
		} else if (visibleHeadings.delete(id)) {
			changed = true;
		}
	}

	if (changed) {
		updateActiveHeading();
	}
}

function updateActiveHeading() {
	const root = previewElement.value;
	const list = headings.value;

	if (!root || !list.length) {
		activeHeadingId.value = "";
		return;
	}

	const intersecting = list.find(item => visibleHeadings.has(item.id));
	if (intersecting) {
		activeHeadingId.value = intersecting.id;
		return;
	}

	const anchorTop = root.getBoundingClientRect().top + 48;
	let current = list[0];
	for (const item of list) {
		if (item.el.getBoundingClientRect().top <= anchorTop) {
			current = item;
		} else {
			break;
		}
	}
	activeHeadingId.value = current?.id ?? "";
}

function scrollToActiveButton() {
	const container = listEl.value;
	const currentId = activeHeadingId.value;

	if (!container || !currentId) {
		return;
	}

	const target = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
		.find(button => button.dataset.id === currentId);

	target?.scrollIntoView({ block: "nearest" });
}

watch(previewElement, () => nextTick(collectHeadings), { immediate: true });

watch(() => props.content, () => nextTick(collectHeadings), {
	flush: "post",
});

watch(activeHeadingId, () => nextTick(scrollToActiveButton), {
	flush: "post",
});

onBeforeUnmount(teardownObserver);
</script>

<style module>
.navigation {
	display: flex;
	flex-direction: column;
	padding: 16px 12px;
	row-gap: 12px;
	background-color: whitesmoke;
	overflow-y: auto;
}

.title {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	color: #333;
}

.list {
	display: flex;
	flex-direction: column;
	row-gap: 4px;
}

.link {
	width: 100%;
	padding: 6px 8px;
	border: none;
	background: none;
	text-align: left;
	font-size: 13px;
	line-height: 1.4;
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

.active {
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
