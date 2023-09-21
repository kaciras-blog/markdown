import MarkdownIt from "markdown-it";
import { Anchor, Classify, Collapsible, Fence, Footnote, highlight, Media, TOC, UGC } from "./index.js";

export const coreRenderer = new MarkdownIt();
coreRenderer.use(Media);
coreRenderer.use(TOC);
coreRenderer.use(Footnote);
coreRenderer.use(Collapsible);

export const trustedRenderer = new MarkdownIt();
trustedRenderer.use(Anchor);
trustedRenderer.use(Footnote);
trustedRenderer.use(TOC);
trustedRenderer.use(Classify);
trustedRenderer.use(Media);
trustedRenderer.use(Collapsible);
trustedRenderer.use(Fence, highlight);

// 评论一般也不长，不需要 TOC；另外没有 Anchor 因为会冲突。
export const guestRenderer = new MarkdownIt();
guestRenderer.use(Footnote);
guestRenderer.use(Classify);
guestRenderer.use(UGC);
guestRenderer.use(Media);
guestRenderer.use(Collapsible);
guestRenderer.use(Fence, highlight);
