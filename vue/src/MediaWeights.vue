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

<script setup lang="ts">
import { IconMusic, IconPhoto, IconVideo } from "@tabler/icons-vue";
import ToolButton from "./ToolButton.vue";
import { AddonContext, useAddonContext } from "./addon-api.ts";

type MediaHandler = (context: AddonContext) => void;

/**
 * 可以指定每个按钮的处理函数，默认仅插入语法片段。
 */
interface MediaWeightProps {
	image?: MediaHandler;
	video?: MediaHandler;
	audio?: MediaHandler;
}

const context = useAddonContext();

// TODO: 类型提示无法推导箭头函数的参数，不知道是 IDE 还是 Vue 的问题。
withDefaults(defineProps<MediaWeightProps>(), {
	image: ctx => ctx.insertText("![]()", false, 4),
	video: ctx => ctx.insertText("@video[]()", true, 9),
	audio: ctx => ctx.insertText("@audio[]()", true, 9),
});
</script>
