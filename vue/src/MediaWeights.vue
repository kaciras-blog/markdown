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
import { editor, Selection } from "monaco-editor/esm/vs/editor/editor.api.js";
import ToolButton from "./ToolButton.vue";
import ICommand = editor.ICommand;
import IEditOperationBuilder = editor.IEditOperationBuilder;
import ITextModel = editor.ITextModel;
import ICursorStateComputerData = editor.ICursorStateComputerData;

const context = useAddonContext();

class InsertCommand implements ICommand {

	readonly selection: Selection;
	readonly text: string;
	readonly isBlock: boolean;

	deltaLine = 0;

	constructor(text: string, selection: Selection, isBlock: boolean) {
		this.text = text;
		this.selection = selection;
		this.isBlock = isBlock;
	}

	computeCursorState(_: ITextModel, __: ICursorStateComputerData) {
		const { selection, deltaLine } = this;
		if (deltaLine === 0) {
			return Selection.fromRange(selection.collapseToEnd(),0);
		}
		const line = selection.startLineNumber + deltaLine;
		return new Selection(line, 0, line, 0);
	}

	private notEmpty(model: ITextModel, n: number) {
		if (n <= 0 || n >= model.getLineCount()) {
			return false;
		}
		return model.getLineLength(n) > 0;
	}

	getEditOperations(model: ITextModel, builder: IEditOperationBuilder) {
		const { selection, text, isBlock } = this;
		const range = selection.getDirection() === 0
			? selection.collapseToEnd()
			: selection.collapseToStart();

		const inserts = ["", "", text, "", ""];
		if (isBlock) {
			const line = range.startLineNumber;
			const eol = model.getEOL();

			if (range.startColumn !== 1) {
				inserts[0] = inserts[1] = eol;
				this.deltaLine += 2;
			} else if (this.notEmpty(model, line - 1)) {
				inserts[0] = eol;
				this.deltaLine += 1;
			}

			if (range.endColumn !== model.getLineLength(line) + 1) {
				inserts[3] = inserts[4] = eol;
				this.deltaLine += 2;
			} else if (this.notEmpty(model, line + 1)) {
				inserts[4] = eol;
				this.deltaLine += 1;
			}
		}

		builder.addEditOperation(range, inserts.join(""));
	}
}

function basename(name: string) {
	const i = name.lastIndexOf(".");
	return i === -1 ? name : name.slice(0, i);
}

async function addImage() {
	const [file] = await selectFile("image/*");
	const url = URL.createObjectURL(file);
	const text = `![${basename(file.name)}](${url})`;

	const range = context.selection.value;
	context.editor.focus();
	context.editor.executeCommand("md.insert", new InsertCommand(text, range, false));
}

async function addVideo() {
	const [file] = await selectFile("video/*");
	const url = URL.createObjectURL(file);
	const text = `@video[](${url})`;

	const range = context.selection.value;
	context.editor.focus();
	context.editor.executeCommand("md.insert", new InsertCommand(text, range, true));
}

async function addAudio() {
	const [file] = await selectFile("image/*");
	const url = URL.createObjectURL(file);
	const text = `@audio[${basename(file.name)}](${url})`;

	const range = context.selection.value;
	context.editor.focus();
	context.editor.executeCommand("md.insert", new InsertCommand(text, range, true));
}
</script>
