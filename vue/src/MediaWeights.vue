<template>
	<ToolButton title='插入图片' @click='image(context)'>
		<IconPhoto/>
	</ToolButton>
	<ToolButton title='插入视频' @click='video(context)'>
		<IconVideo/>
	</ToolButton>
	<ToolButton title='插入音频' @click='audio(context)'>
		<IconMusic/>
	</ToolButton>
</template>

<script lang='ts'>
import { selectFile } from "@kaciras/utilities/browser";
import { AddonContext } from "./addon-api.ts";

function basename(name: string) {
	const i = name.lastIndexOf(".");
	return i === -1 ? name : name.slice(0, i);
}

async function addImage(ctx: AddonContext) {
	const [file] = await selectFile("image/*");
	const url = URL.createObjectURL(file);
	ctx.insertText(`![${basename(file.name)}](${url})`, false);
}

async function addVideo(ctx: AddonContext) {
	const [file] = await selectFile("video/*");
	const url = URL.createObjectURL(file);
	ctx.insertText(`@video[](${url})`, true);
}

async function addAudio(ctx: AddonContext) {
	const [file] = await selectFile("image/*");
	const url = URL.createObjectURL(file);
	ctx.insertText(`@audio[${basename(file.name)}](${url})`, true);
}
</script>

<script setup lang="ts">
import { IconMusic, IconPhoto, IconVideo } from "@tabler/icons-vue";
import ToolButton from "./ToolButton.vue";
import { useAddonContext } from "./addon-api.ts";

type MediaHandler = (context: AddonContext) => void;

interface MediaWeightProps {
	image?: MediaHandler;
	video?: MediaHandler;
	audio?: MediaHandler;
}

const context = useAddonContext();

withDefaults(defineProps<MediaWeightProps>(), {
	image: addImage, video: addVideo, audio: addAudio,
});
</script>
