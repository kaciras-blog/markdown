<template>
	<KxButton type='icon' title='双列视图' @click='viewMode = 0'>
		<SplitIcon/>
	</KxButton>
	<KxButton type='icon' title='Markdown 视图' @click='viewMode = 1'>
		<EditIcon/>
	</KxButton>
	<KxButton type='icon' title='预览视图' @click='viewMode = 2'>
		<EyeIcon/>
	</KxButton>

	<KxButton type='icon' color='primary' title='同步滚动' @click='scrollSynced = !scrollSynced'>
		<DownUpIcon/>
	</KxButton>
	<KxButton type='icon' color='primary' title='小地图' @click='options.minimap.enabled = !options.minimap.enabled'>
		<MapIcon/>
	</KxButton>
	<KxButton type='icon' color='primary' title='自动换行'
			  @click='options.wordWrap = options.wordWrap == "on" ? "off": "on"'>
		<ReturnLeftIcon/>
	</KxButton>
</template>

<script setup lang="ts">
import { KxButton } from "@kaciras-blog/uikit";
import SplitIcon from "@material-design-icons/svg/round/vertical_split.svg?sfc";
import EditIcon from "bootstrap-icons/icons/pencil-square.svg?sfc";
import EyeIcon from "bootstrap-icons/icons/eye-fill.svg?sfc";
import DownUpIcon from "bootstrap-icons/icons/arrow-down-up.svg?sfc";
import ReturnLeftIcon from "bootstrap-icons/icons/arrow-return-left.svg?sfc";
import MapIcon from "bootstrap-icons/icons/pin-map-fill.svg?sfc";
import { useAddonContext } from "./editor-addon.ts";

const { viewMode, scrollSynced, options } = useAddonContext();
</script>
