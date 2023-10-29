// 直接将 SFC 作为构建入口会导致生成额外的文件，所以用个 TS 文件来导出。
export { default } from "./MarkdownBox.vue";
