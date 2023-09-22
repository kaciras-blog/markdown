<template>
	<ToolButton title='双列视图' :active='viewMode === 0' @click='viewMode = 0'>
		<IconColumns2/>
	</ToolButton>
	<ToolButton title='Markdown 视图' :active='viewMode === 1' @click='viewMode = 1'>
		<IconEdit/>
	</ToolButton>
	<ToolButton title='预览视图' :active='viewMode === 2' @click='viewMode = 2'>
		<IconFileSearch/>
	</ToolButton>

	<ToolButton title='同步滚动' :active='scrollSynced' @click='scrollSynced = !scrollSynced'>
		<IconArrowsUpDown/>
	</ToolButton>
	<ToolButton title='小地图' :active='options.minimap!.enabled' @click='toggleMinimap'>
		<IconCompass/>
	</ToolButton>
	<ToolButton title='自动换行' :active='options.wordWrap === "on"' @click='toggleSoftWrap'>
		<IconTextWrap/>
	</ToolButton>
</template>

<script setup lang="ts">
import { IconArrowsUpDown, IconColumns2, IconCompass, IconEdit, IconFileSearch, IconTextWrap } from "@tabler/icons-vue";
import ToolButton from "./ToolButton.vue";
import { useAddonContext } from "./addon-api.ts";

const { viewMode, scrollSynced, options } = useAddonContext();

function toggleMinimap() {
	const minimap = options.value.minimap!;
	minimap.enabled = !minimap.enabled;
}

function toggleSoftWrap() {
	const { wordWrap } = options.value;
	options.value.wordWrap = wordWrap === "on" ? "off" : "on";
}
</script>
