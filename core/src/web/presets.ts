import MarkdownIt from "markdown-it";
import { Anchor, Classify, Footnote, TOC, UGC } from "../index.ts";
import fence from "./fence.js";
import highlight from "./highlight.js";
import { clientMediaPlugin } from "./media.js";

export const trustedRenderer = new MarkdownIt();
trustedRenderer.use(fence, highlight);
trustedRenderer.use(Anchor);
trustedRenderer.use(Footnote);
trustedRenderer.use(TOC);
trustedRenderer.use(Classify);
trustedRenderer.use(clientMediaPlugin);

// 评论一般也不长，不需要 TOC；另外没有 Anchor 因为会冲突。
export const guestRenderer = new MarkdownIt();
guestRenderer.use(fence, highlight);
guestRenderer.use(Footnote);
guestRenderer.use(Classify);
guestRenderer.use(UGC);
guestRenderer.use(clientMediaPlugin);
