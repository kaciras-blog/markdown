<template>
	<ToolButton title='双列视图' :active='viewMode === 0' @click='viewMode = 0'>
		<SplitIcon/>
	</ToolButton>
	<ToolButton title='Markdown 视图' :active='viewMode === 1' @click='viewMode = 1'>
		<EditIcon/>
	</ToolButton>
	<ToolButton title='预览视图' :active='viewMode === 2' @click='viewMode = 2'>
		<EyeIcon/>
	</ToolButton>

	<ToolButton title='同步滚动' :active='scrollSynced' @click='scrollSynced = !scrollSynced'>
		<DownUpIcon/>
	</ToolButton>
	<ToolButton title='小地图' :active='options.minimap!.enabled' @click='toggleMinimap'>
		<MapIcon/>
	</ToolButton>
	<ToolButton title='自动换行' :active='options.wordWrap==="on"' @click='toggleSoftWrap'>
		<ReturnLeftIcon/>
	</ToolButton>
</template>

<script setup lang="ts">
import SplitIcon from "@material-design-icons/svg/round/vertical_split.svg?sfc";
import EditIcon from "bootstrap-icons/icons/pencil-square.svg?sfc";
import EyeIcon from "bootstrap-icons/icons/eye-fill.svg?sfc";
import DownUpIcon from "bootstrap-icons/icons/arrow-down-up.svg?sfc";
import ReturnLeftIcon from "bootstrap-icons/icons/arrow-return-left.svg?sfc";
import MapIcon from "bootstrap-icons/icons/pin-map-fill.svg?sfc";
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
