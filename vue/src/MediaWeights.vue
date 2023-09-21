<template>
	<ToolButton type='icon' title='插入图片' @click='addImage'>
		<ImageIcon/>
	</ToolButton>
	<ToolButton type='icon' title='插入视频' @click='addVideo'>
		<VideoIcon/>
	</ToolButton>
	<ToolButton type='icon' title='插入音频' @click='addAudio'>
		<MusicIcon/>
	</ToolButton>
</template>

<script setup lang="ts">
import ImageIcon from "bootstrap-icons/icons/image-fill.svg?sfc";
import VideoIcon from "bootstrap-icons/icons/play-btn.svg?sfc";
import MusicIcon from "bootstrap-icons/icons/music-note-beamed.svg?sfc";
import { selectFile } from "@kaciras/utilities/browser";
import { useAddonContext } from "./addon-api.ts";
import ToolButton from "./ToolButton.vue";

const context = useAddonContext();

function basename(name: string) {
	const i = name.lastIndexOf(".");
	return i === -1 ? name : name.slice(0, i);
}

async function addImage() {
	const [file] = await selectFile("image/*");
	const url = URL.createObjectURL(file);
	context.insertText(`![${basename(file.name)}](${url})`, true);
}

async function addVideo() {
	const [file] = await selectFile("video/*");
	const url = URL.createObjectURL(file);
	context.insertText(`@video[](${url})`, true);
}

async function addAudio() {
	const [file] = await selectFile("image/*");
	const url = URL.createObjectURL(file);
	context.insertText(`@audio[${basename(file.name)}](${url})`, true);
}
</script>
