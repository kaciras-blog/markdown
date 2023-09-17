<template>
	<KxButton type='icon' color='primary' title='双列视图' @click='viewMode = 0'>
		<SplitIcon/>
	</KxButton>
	<KxButton type='icon' color='primary' title='Markdown 视图' @click='viewMode = 1'>
		<EditIcon/>
	</KxButton>
	<KxButton type='icon' color='primary' title='预览视图' @click='viewMode = 2'>
		<EyeIcon/>
	</KxButton>
</template>

<script setup lang="ts">
import { KxButton } from "@kaciras-blog/uikit";
import SplitIcon from "@material-design-icons/svg/round/vertical_split.svg?sfc";
import EditIcon from "bootstrap-icons/icons/pencil-square.svg?sfc";
import EyeIcon from "bootstrap-icons/icons/eye-fill.svg?sfc";
import { useAddonContext } from "./editor-addon.ts";

const { viewMode } = useAddonContext();
</script>
