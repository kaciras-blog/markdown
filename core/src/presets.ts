import MarkdownIt from "markdown-it";
import { Anchor, Classify, Collapsible, Directive, Fence, Footnote, highlight, Media, TOC, UGC } from "./index.js";

/**
 * 仅添加语法类插件，渲染的结果只有必要的标签，
 * 用于给第三方阅读器使用（RSS,阅读模式……）。
 */
export const coreRenderer = new MarkdownIt();
coreRenderer.use(Directive);
coreRenderer.use(TOC);
coreRenderer.use(Footnote);
coreRenderer.use(Collapsible);

/**
 * 添加了所有的插件，适合于可信的输入（站长自己写的内容）。
 */
export const trustedRenderer = new MarkdownIt();
trustedRenderer.use(Anchor);
trustedRenderer.use(Footnote);
trustedRenderer.use(TOC);
trustedRenderer.use(Classify);
trustedRenderer.use(Media);
trustedRenderer.use(Collapsible);
trustedRenderer.use(Fence, highlight);

/**
 * 相较于 trustedRenderer，移除了一些用于长文的插件，
 * 同时加入了 UGC 防止滥用链接，适合渲染用户评论。
 */
export const guestRenderer = new MarkdownIt();
guestRenderer.use(Footnote);
guestRenderer.use(Classify);
guestRenderer.use(UGC);
guestRenderer.use(Media);
guestRenderer.use(Collapsible);
guestRenderer.use(Fence, highlight);
