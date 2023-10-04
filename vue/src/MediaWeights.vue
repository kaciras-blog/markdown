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
import { AddonContext } from "./addon-api.ts";

async function addImage(ctx: AddonContext) {
	ctx.insertText("![]()", false);
}

async function addVideo(ctx: AddonContext) {
	ctx.insertText("@video[]()", true);
}

async function addAudio(ctx: AddonContext) {
	ctx.insertText("@audio[]()", true);
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
