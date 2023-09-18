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
import { selectFile } from "@kaciras/utilities/browser";
import ImageIcon from "bootstrap-icons/icons/image-fill.svg?sfc";
import VideoIcon from "bootstrap-icons/icons/play-btn.svg?sfc";
import MusicIcon from "bootstrap-icons/icons/music-note-beamed.svg?sfc";
import { useAddonContext } from "./addon-api.ts";
import { editor, Selection } from "monaco-editor";
import ToolButton from "./ToolButton.vue";
import ICommand = editor.ICommand;
import IEditOperationBuilder = editor.IEditOperationBuilder;
import ITextModel = editor.ITextModel;
import ICursorStateComputerData = editor.ICursorStateComputerData;

const context = useAddonContext();

function basename(name: string) {
	const i = name.lastIndexOf(".");
	return i === -1 ? name : name.slice(0, i);
}

class InsertImageCommand implements ICommand {

	readonly file: File;
	readonly url: string;

	deltaColumn = NaN;

	constructor(file: File) {
		this.file = file;
		this.url = URL.createObjectURL(file);
	}

	computeCursorState(_: ITextModel, __: ICursorStateComputerData) {
		const range = context.selection.value;
		return new Selection(
			range.selectionStartLineNumber,
			range.selectionStartColumn,
			range.positionLineNumber,
			range.positionColumn + this.deltaColumn,
		);
	}

	getEditOperations(model: ITextModel, builder: IEditOperationBuilder) {
		const range = context.selection.value;
		const label = range.isEmpty()
			? basename(this.file.name)
			: model.getValueInRange(range).replaceAll("\n", "");

		const text = `![${label}](${this.url})`;
		this.deltaColumn = text.length;
		builder.addEditOperation(range, text);
	}
}

class InsertDirectiveCommand implements ICommand {

	computeCursorState(model: ITextModel, helper: ICursorStateComputerData) {
		return undefined;
	}

	getEditOperations(model: ITextModel, builder: IEditOperationBuilder) {
	}
}

async function addImage() {
	const [file] = await selectFile("image/*");
	context.editor.executeCommand("MD.Insert", new InsertImageCommand(file));
	context.editor.focus();
}

async function addVideo(initFiles: File[] = []) {
	const result = await dialog
		.show<VideoStatement>(VideoVideoDialog, { initFiles });

	if (!result.isConfirm) {
		return;
	}
	const { src, vw, vh, label, poster, isVideo } = result.data;
	const text = isVideo
		? `@video[${poster}](${src})`
		: `@gif[${label}](${src})`;


}

async function addAudio(file?: File) {
	file ??= await selectFile("audio/*");
	const res = await api.media.uploadAudio(file);

}

defineExpose({ addImage, addVideo, addAudio });
</script>
