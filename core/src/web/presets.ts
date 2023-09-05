import MarkdownIt from "markdown-it";
import { Anchor, Classify, Footnote, TOC, UGC } from "../common/index.js";
import fence from "./fence.js";
import highlight from "./highlight.js";
import { clientMediaPlugin } from "./media.js";

export const articleRenderer = new MarkdownIt();
articleRenderer.use(fence, highlight);
articleRenderer.use(Anchor);
articleRenderer.use(Footnote);
articleRenderer.use(TOC);
articleRenderer.use(Classify);
articleRenderer.use(clientMediaPlugin);

// 评论一般也不长，不需要 TOC；另外没有 Anchor 因为会冲突。
export const discussionRenderer = new MarkdownIt();
discussionRenderer.use(fence, highlight);
discussionRenderer.use(Footnote);
discussionRenderer.use(Classify);
discussionRenderer.use(UGC);
discussionRenderer.use(clientMediaPlugin);