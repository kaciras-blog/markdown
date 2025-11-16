<template>
	<aside class='navigation' aria-label='文档导航'>
		<h2 class='navigationTitle'>目录</h2>
		<ul
			v-if='headings.length'
			class='navigationList'
			ref='listEl'
		>
			<li
				v-for='item in headings'
				:key='item.id'
			>
				<button
					type='button'
					class='navigationLink'
					:class='{ navigationLinkActive: activeHeadingId === item.id }'
					:data-id='item.id'
					:style='{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }'
					:aria-current='activeHeadingId === item.id ? "true" : undefined'
					@click='scrollToHeading(item)'
				>
					{{ item.title }}
				</button>
			</li>
		</ul>
		<p
			v-else
			class='navigationEmpty'
		>
			当前预览没有标题
		</p>
	</aside>
</template>

<script setup lang='ts'>
import { ComponentPublicInstance, computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";

interface PreviewNavigationProps {
	previewRoot?: ComponentPublicInstance | null;
	content: string;
}

interface HeadingItem {
	id: string;
	title: string;
	level: number;
	el: HTMLElement;
}

const props = defineProps<PreviewNavigationProps>();

const headings = shallowRef<HeadingItem[]>([]);
const activeHeadingId = ref("");
const listEl = ref<HTMLUListElement>();
const scrollContainer = ref<HTMLElement>();
let scrollFrame = 0;

const previewElement = computed(() => props.previewRoot?.$el as HTMLElement | undefined);

function collectHeadings() {
	const root = previewElement.value;
	if (!root) {
		headings.value = [];
		activeHeadingId.value = "";
		return;
	}

	const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"));
	const items = nodes.map(element => ({
		id: element.id,
		title: element.textContent?.trim() ?? "",
		level: Number(element.tagName.slice(1)),
		el: element,
	})).filter(item => item.id && item.title);

	headings.value = items;
	updateActiveHeading();
	nextTick(scrollActiveIntoView);
}

function scrollToHeading(item: HeadingItem) {
	item.el.scrollIntoView({ behavior: "smooth", block: "start" });
	activeHeadingId.value = item.id;
}

function setupPreviewScrollListener() {
	const root = previewElement.value;

	if (scrollContainer.value === root) {
		return;
	}

	scrollContainer.value?.removeEventListener("scroll", handlePreviewScroll);
	scrollContainer.value = root ?? undefined;

	if (root) {
		root.addEventListener("scroll", handlePreviewScroll, { passive: true });
	}
}

function handlePreviewScroll() {
	if (scrollFrame) {
		return;
	}
	scrollFrame = requestAnimationFrame(() => {
		scrollFrame = 0;
		updateActiveHeading();
	});
}

function updateActiveHeading() {
	const container = scrollContainer.value;
	const list = headings.value;

	if (!container || !list.length) {
		activeHeadingId.value = "";
		return;
	}

	const containerRect = container.getBoundingClientRect();
	const anchorOffset = 48;
	let current = list[0];

	for (const item of list) {
		const offset = item.el.getBoundingClientRect().top - containerRect.top;
		if (offset <= anchorOffset) {
			current = item;
		} else {
			break;
		}
	}

	activeHeadingId.value = current?.id ?? "";
}

function scrollActiveIntoView() {
	const container = listEl.value;
	const currentId = activeHeadingId.value;

	if (!container || !currentId) {
		return;
	}

	const target = Array.from(container.querySelectorAll<HTMLButtonElement>("button[data-id]"))
		.find(button => button.dataset.id === currentId);

	target?.scrollIntoView({ block: "nearest" });
}

watch(previewElement, () => {
	nextTick(() => {
		setupPreviewScrollListener();
		collectHeadings();
	});
}, { immediate: true });

watch(() => props.content, () => nextTick(collectHeadings), {
	flush: "post",
});

watch(activeHeadingId, () => nextTick(scrollActiveIntoView), {
	flush: "post",
});

onBeforeUnmount(() => {
	scrollContainer.value?.removeEventListener("scroll", handlePreviewScroll);
	if (scrollFrame) {
		cancelAnimationFrame(scrollFrame);
		scrollFrame = 0;
	}
});
</script>

<style scoped>
.navigation {
	grid-row: 2;
	grid-column: 3;
	display: flex;
	flex-direction: column;
	padding: 16px 12px;
	row-gap: 12px;
	border-left: 1px solid #e0e0e0;
	background-color: #f6f8fa;
	overflow-y: auto;
}

.navigationTitle {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	color: #333;
}

.navigationList {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	row-gap: 4px;
}

.navigationLink {
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

.navigationLink:hover,
.navigationLink:focus-visible {
	background-color: rgba(15, 76, 129, 0.12);
	outline: none;
}

.navigationLinkActive {
	background-color: rgba(0, 116, 232, 0.14);
	color: #0f4c81;
	font-weight: 600;
}

.navigationEmpty {
	margin: 0;
	font-size: 12px;
	color: #909090;
}
</style>
