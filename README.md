# Kaciras Flavored Markdown

[![Test](https://github.com/kaciras-blog/markdown/actions/workflows/test.yml/badge.svg)](https://github.com/kaciras-blog/markdown/actions/workflows/test.yml)

一个扩展的 Markdown 转换器，以及基于 [monaco-editor](https://github.com/microsoft/monaco-editor) 的 Markdown 编辑器。在 [Kaciras Blog](https://blog.kaciras.com) 项目中使用。

[演示页面](https://kaciras-blog.github.io/markdown)

# @kaciras-blog/markdown

Markdown 到 HTML 的转换器，基于 [markdown-it](https://github.com/markdown-it/markdown-it)，并加入了一些插件：

* Directive：解析 `@type[label](url)` 语法，默认将 `@video[]()`、`@audio[]()` 和 `@gif[]()` 渲染为对应的媒体元素。
* Media：替代 Directive 插件和默认的图片渲染器，输出样式更好的 HTML，并支持懒加载。
* Fence：替代默认的代码块渲染器，输出样式更好的 HTML。
* TOC：[markdown-it-toc-done-right](https://github.com/nagaozen/markdown-it-toc-done-right)。
* Footnote：[markdown-it-footnote](https://github.com/markdown-it/markdown-it-footnote)，调整了一些选项。
* Anchor：[markdown-it-anchor](https://github.com/valeriangalliat/markdown-it-anchor)，调整了一些选项。
* Classify：给行内代码加个 inline-code 类以便跟代码块区分。
* UGC：给所有链接加上 rel="ugc,nofollow" 防止刷外链，推荐用于渲染用户的输入。
* Collapsible：解析类似 HTML `<details>` 元素的语法，渲染出对应的元素，可在禁止直接写 HTML 的情况下使用。
* highlight：基于 [highlight.js](https://github.com/highlightjs/highlight.js) 的语法高亮函数，添加了差分功能，并移除了一些不常用语言的支持。

```
pnpm i @kaciras-blog/markdown
```

为了支持 Tree-Shaking，该库有多个导入点：

* `@kaciras-blog/markdown` 主要入口，导出了所有的功能。
* `@kaciras-blog/markdown/style.css` 样式表。
* `@kaciras-blog/markdown/activate` 仅包含 `activate` 函数，搭配预先渲染好的 HTML 可以避免引入体积较大的转换器。
* `@kaciras-blog/markdown/presets` 预先配置好了一些渲染器，对应一些常见情况：
  * coreRenderer：渲染的结果只有必要的标签，用于给第三方阅读器使用（RSS,阅读模式……）。
  * trustedRenderer：添加了所有的插件，适合于可信的输入（站长自己写的内容）。
  * guestRenderer：相较于 trustedRenderer，移除了一些长文的插件，加入了 UGC 防止滥用链接，适用于用户评论。

创建 MarkdownIt 实例并添加一些插件：

```typescript
import { MarkdownIt, Media, Fence, highlight } from "@kaciras-blog/markdown/presets";

const md = new MarkdownIt();
md.use(Media)
md.use(Fence, highlight);

console.log(md.render("![](img.png)\n\n```diff-html\n+foo\n-bar\n```"));
```

使用预设渲染器，并将结果挂载到 DOM 上。

```typescript
import "@kaciras-blog/markdown/style.css";
import { trustedRenderer } from "@kaciras-blog/markdown/presets";
import { activate } from "@kaciras-blog/markdown";

const html = trustedRenderer.render("@video[](file.mp4)");

document.body.innerHTML = html;

document.body.className = "markdown";
activate(document.body); // Media 和 Fence 插件渲染出的 HTML 具有交互功能，需要激活。
```

# @kaciras-blog/markdown-vue

简单的在线 Markdown 编辑器，基于 monaco-editor，使用 Vue 编写。

```
pnpm i @kaciras-blog/markdown-vue
```

为了支持 Tree-Shaking，该库有多个导入点：

* `@kaciras-blog/markdown-vue` 主要入口，导出了所有的组件，包括体积很大的编辑器。
* `@kaciras-blog/markdown-vue/style.css` 样式表，包含了 `@kaciras-blog/markdown` 的样式。
* `@kaciras-blog/markdown-vue/box` 仅 MarkdownBox 组件，搭配预先渲染好的 HTML 可以避免引入体积较大的转换器。
* `@kaciras-blog/markdown-vue/view` 仅 MarkdownView 组件，不需要编辑器的话请使用这个。

[编辑器用法示例](./vue/demo/App.vue)

```vue
<!-- 已经有渲染好的 HTML，使用 MarkdownBox 来展示。 -->
<template>
    <MarkdownBox :html='html'/>
</template>

<script setup>
import "@kaciras-blog/markdown-vue/style.css";
import { ref } from "vue";
import MarkdownBox from "@kaciras-blog/markdown-vue/box";

const html = ref("<p>Rendered markdown HTML</p>");
</script>
```

```vue
<!-- 使用 MarkdownView 来渲染 Markdown 内容。 -->
<template>
    <MarkdownView :value='markdown'/>
</template>

<script setup>
import "@kaciras-blog/markdown-vue/style.css";
import { ref } from "vue";
import MarkdownView from "@kaciras-blog/markdown-vue/view";

const markdown = ref("# h1 Heading");
</script>
```
