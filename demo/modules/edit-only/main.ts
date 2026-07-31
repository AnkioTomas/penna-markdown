import "../../_common/penna-demo.scss";
import "../../_common/layout.scss";

import { Penna } from "@/editor/Penna.js";
import type { EditorLayoutMode } from "@/editor/Layout.js";
import { setupThemeAndAppearance } from "../../_common/theme.js";

const GUIDE = `---
title: 仅编辑布局
subtitle: layout: "edit"
---

# [[title]]

> [[subtitle]] — 本页初始为**纯编辑**。右侧不应出现空白预览栏。

## 正确用法

\`\`\`ts
new Penna(mount, {
  layout: "edit",
  editor: { value: "# hello" },
});
\`\`\`

\`layout: "edit"\` 时，Penna 内部的 \`.penna-preview\` / \`.penna-divider\` 是 \`display: none\`，**不会占位**。

## 常见误用（会导致“预览空白”）

1. 外层自己又画了一列预览容器，却只把 Penna 设成 \`edit\` —— 那列永远是空的。
2. 只引了 \`penna-render\` 样式，没引 \`penna-editor-base\` —— 布局 class 不生效，预览栏露出来但是空的。
3. 想要编辑 + 预览：用 \`layout: "split"\`，不要自己再拼一列空 div。

## 自测

1. 看本页：编辑区应占满，没有右侧空白。
2. 点状态栏「分栏 / 纯预览」：预览应立刻有内容（不是空白）。
3. 再切回「纯编辑」：预览栏再次消失，不留白边。

## 试写

- **加粗**、*斜体*、\`code\`
- > [!TIP] 自定义标题
> 仅编辑模式下工具栏仍可用。
`;

const mount = document.getElementById("penna-editor");
if (!mount) throw new Error("#penna-editor missing");
const root = mount;

const badge = document.getElementById("layout-badge");

const editor = new Penna(root, {
  layout: "edit",
  debug: true,
  sidebar: false,
  editor: {
    value: GUIDE,
    lineNumbers: true,
  },
  preview: {
    maxWidth: "720px",
  },
});

setupThemeAndAppearance(editor);

function describePreviewVisibility(): string {
  const preview = root.querySelector(".penna-preview") as HTMLElement | null;
  if (!preview) return "preview=missing";
  const display = getComputedStyle(preview).display;
  const width = Math.round(preview.getBoundingClientRect().width);
  return `preview display:${display} w:${width}px`;
}

function refreshBadge(mode = editor.getLayout()) {
  if (!badge) return;
  badge.textContent = `layout:${mode} · ${describePreviewVisibility()}`;
}

refreshBadge();
editor.eventBus.on<{ mode: EditorLayoutMode }>("editor:layout", (payload) => {
  refreshBadge(payload.mode);
});
window.addEventListener("resize", () => refreshBadge(), { passive: true });

window.addEventListener(
  "beforeunload",
  () => {
    editor.destroy();
  },
  { once: true },
);
