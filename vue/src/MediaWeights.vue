<template>
	<ToolButton title='插入图片' @click='addImage'>
		<IconPhoto/>
	</ToolButton>
	<ToolButton title='插入视频' @click='addVideo'>
		<IconVideo/>
	</ToolButton>
	<ToolButton title='插入音频' @click='addAudio'>
		<IconMusic/>
	</ToolButton>
</template>

<script setup lang="ts">
import { selectFile } from "@kaciras/utilities/browser";
import { IconMusic, IconPhoto, IconVideo } from "@tabler/icons-vue";
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
