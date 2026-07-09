import "../../_common/cherry-demo.scss";
import "../../_common/layout.scss";

import { Cherry } from "@/editor/Cherry.js";
import { setupThemeAndAppearance } from "../../_common/theme.js";
import {
  fetchDocsList,
  fetchDocContent,
  fetchMarkdownFileItems,
} from "../../_common/api.js";

// 引入所需的基础类库用于演示自定义高亮与解析
import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import type { InlineParseResult } from "@/transformer/core/ParserBase.js";
import { MatchDecorator, Decoration, ViewPlugin } from "@codemirror/view";
import { StateEffect } from "@codemirror/state";

const DOCS_DIR = "/docs/";

// ==========================================
// 演示 1：自定义语法解析器（解析 @@text@@）
// ==========================================
class CustomAtParser extends BaseInlineParser {
  constructor() {
    super("custom_at", true);
  }

  override canOpenAt(src: string, index: number): boolean {
    return src.startsWith("@@", index);
  }

  override parse(
    src: string,
    index: number,
    ctx: InlineParseContext,
  ): InlineParseResult | null {
    const start = index + 2;
    const end = src.indexOf("@@", start);
    if (end > -1) {
      const text = src.slice(start, end);
      return {
        node: createNode("custom_at", end - index + 2, undefined, undefined, {
          text,
        }),
        nextIndex: end + 2,
      };
    }
    return null;
  }

  override render(node: MarkdownNode, ctx: RenderContext): string {
    const text = (node.props?.text as string) || "";
    return `<span style="color: #007aff; font-weight: bold; background: rgba(0,122,255,0.1); padding: 0 4px; border-radius: 4px;">@${text}</span>`;
  }
}

// ==========================================
// 演示 2：自定义高亮（同步高亮编辑器里的 @@text@@）
// ==========================================
const customAtDecorator = new MatchDecorator({
  regexp: /@@(.*?)@@/g,
  decoration: Decoration.mark({
    class: "cm-custom-at",
    style:
      "color: #007aff; font-weight: bold; background: rgba(0,122,255,0.1); border-radius: 2px;",
  }),
});
const customAtPlugin = ViewPlugin.define(
  (view) => ({
    decorations: customAtDecorator.createDeco(view),
    update(u) {
      this.decorations = customAtDecorator.updateDeco(u, this.decorations);
    },
  }),
  { decorations: (v) => v.decorations },
);

// ==========================================
// 演示 3：AI 工具栏（mockAIRequest 返回修改后的文档正文，走 diff）
// ==========================================
const AI_DEMO_APPEND = `

---

## AI 功能演示

> 选中一段文字只处理选区；不选则处理全文。AI 返回的是**修改后的正文**，编辑器会展示行级 diff。

### 段落 A（润色 / 纠错）

这段文字有点啰嗦，而且有些地方写错了，比如「的得地」混用，还有多余的双空格  在这里。

### 段落 B（翻译）

The quick brown fox jumps over the lazy dog. This sentence is commonly used for typing practice.

### 段落 C（扩写 / 改写）

春天来了。

### 列表（提取要点）

- 支持行级 diff 逐块确认
- 未全部确认前禁止编辑
- 无选区时默认处理全文
`;

const AI_DEMO_ONLY = `# AI 演示文档

${AI_DEMO_APPEND.trim()}
`;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function ensureChanged(text: string, result: string): string {
  if (result !== text) return result;
  if (!text.trim()) return text;
  return text.endsWith("\n") ? `${text} ` : `${text}\n`;
}

/** 模拟 AI：返回替换后的文档片段（非 UI 提示） */
async function mockAIRequest(
  action: string,
  text: string,
  prompts?: string,
): Promise<string> {
  await delay(700 + Math.random() * 600);

  let result: string;

  switch (action) {
    case "polish":
      if (text.includes("有点啰嗦")) {
        result =
          "这段文字稍显冗长，部分表述存在笔误，例如「的得地」使用不当，此处多余的双空格已去除。";
      } else if (text.includes("稍显冗长")) {
        result = text
          .replace(/稍显冗长/g, "仍略偏长")
          .replace(/存在笔误/g, "仍有可改进之处");
      } else {
        result = text
          .replace(/\s{2,}/g, " ")
          .replace(/有点/g, "较为")
          .replace(/写错了/g, "存在笔误")
          .replace(/，，+/g, "，")
          .replace(/。。+/g, "。");
      }
      break;

    case "shorten":
      if (text.includes("有点啰嗦")) {
        result = "文字冗长且有笔误，「的得地」混用，双空格未清理。";
      } else if (text.includes("The quick brown fox")) {
        result = "The quick brown fox jumps over the lazy dog.";
      } else {
        result = text
          .split("\n")
          .filter((line) => line.trim())
          .slice(0, Math.max(1, Math.ceil(text.split("\n").length / 2)))
          .join("\n");
      }
      break;

    case "expand":
      if (text.trim() === "春天来了。") {
        result =
          "春天来了。万物复苏，枝头吐出新绿，空气里带着泥土与花草的气息，一切都显得生机勃勃。";
      } else {
        result = `${text.trim()}\n\n此外，还可以从背景、例证和细节展开，使论述更完整，层次更清晰。`;
      }
      break;

    case "translate":
      if (text.includes("The quick brown fox")) {
        result = "敏捷的棕色狐狸跳过懒狗。这句话常用于打字练习。";
      } else if (text.includes("敏捷的棕色狐狸")) {
        result = "那只敏捷的棕色狐狸，一跃而过，从一只懒洋洋的狗身上跨过。";
      } else {
        result = text
          .split("\n")
          .map((line) => {
            const t = line.trim();
            if (!t) return line;
            if (/[a-zA-Z]/.test(t)) return `（译文）${t}`;
            return line;
          })
          .join("\n");
      }
      break;

    case "summarize":
      if (text.includes("有点啰嗦")) {
        result = "原文冗长且有笔误，「的得地」混用，存在多余空格。";
      } else if (text.includes("The quick brown fox")) {
        result = "一句用于打字练习的英文谚语。";
      } else if (text.includes("春天来了")) {
        result = "春天到来。";
      } else if (text.includes("支持行级 diff")) {
        result =
          "编辑器支持行级 diff、逐块确认，未确认前禁止编辑；无选区时处理全文。";
      } else {
        result = text
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, Math.min(80, text.length));
      }
      break;

    case "rewrite":
      if (text.includes("有点啰嗦")) {
        result =
          "本节文字偏长，个别地方表述不当，「的得地」用法有误，并残留了连续空格。";
      } else if (text.trim() === "春天来了。") {
        result = "春日已至。";
      } else {
        result = text
          .split("\n")
          .map((line) => (line.trim() ? line.replace(/^[-*]\s*/, "• ") : line))
          .join("\n");
      }
      break;

    case "keyPoints":
      if (text.includes("支持行级 diff")) {
        result =
          "1. 行级 diff，逐块确认\n2. 未全部确认前禁止编辑\n3. 无选区时处理全文";
      } else {
        result = text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, i) => `${i + 1}. ${line.replace(/^[-*#\d.]+\s*/, "")}`)
          .join("\n");
      }
      break;

    case "tone":
      if (text.includes("有点啰嗦")) {
        result =
          "兹有文字一段，表述略嫌繁复，且部分用语欠妥，「的得地」用法亦有可改进之处，并存在多余空格。";
      } else {
        result = text
          .split("\n")
          .map((line) =>
            line.trim()
              ? `敬启者，${line.trim().replace(/[。！？]$/, "")}。此致敬礼。`
              : line,
          )
          .join("\n");
      }
      break;

    case "explain":
      if (text.includes("The quick brown fox")) {
        result =
          "这是一句英文打字练习常用句，包含全部 26 个英文字母，便于测试键盘输入。";
      } else if (text.trim() === "春天来了。") {
        result =
          "这句话表示季节更替，春天开始，常用来描写自然复苏、气温回暖的景象。";
      } else {
        result = `这段话的意思是：${text.replace(/\s+/g, " ").trim()}`;
      }
      break;

    case "proofread":
      if (text.includes("有点啰嗦")) {
        result =
          "这段文字有点啰嗦，而且有些地方写错了，比如「的得地」混用，还有多余的双空格在这里。";
      } else {
        result = text
          .replace(/\s{2,}/g, " ")
          .replace(/的的/g, "的")
          .replace(/，，/g, "，");
      }
      break;

    case "custom": {
      const hint = prompts?.trim() || "优化表达";
      if (text.includes("有点啰嗦") && /口语|通俗/.test(hint)) {
        result =
          "这段话写得有点绕，还有些错别字，「的得地」也没分清，空格也多了。";
      } else if (text.trim() === "春天来了。" && /详细|扩写/.test(hint)) {
        result = "春天来了，到处都活过来了，树发芽了，风也暖和了。";
      } else {
        result = text
          .split("\n")
          .map((line) =>
            line.trim() ? line.replace(/。$/, `（${hint}）`) : line,
          )
          .join("\n");
      }
      break;
    }

    default:
      result = text;
  }

  return ensureChanged(text, result);
}

async function init() {
  const docs = await fetchDocsList(DOCS_DIR);

  let editor: Cherry;

  async function loadDoc(href: string) {
    const content = await fetchDocContent(href);
    editor.setMarkdown(content + AI_DEMO_APPEND);
    editor.setSidebarActiveFile(href);
  }

  editor = new Cherry(document.querySelector("#cherry-editor")!!, {
    id: "cherry-demo-editor",
    layout: "split",
    appearance: "light",
    themeId: "default",
    debug: true,

    ai: {
      AIRequest: mockAIRequest,
    },
    // ==========================================
    // 演示 4：自定义 Toolbar（新增一个工具栏按钮）
    // ==========================================
    toolbar: {
      items: [
        {
          id: "custom-btn",
          type: "button",
          label: "🚀 起飞",
          title: "自定义按钮演示",
          onClick: (ctx) => {
            alert("点击了自定义工具栏按钮！");
            ctx.focus();
          },
        },
      ],
    },

    sidebar: {
      maxWidth: 300,
      fetchFiles: () => fetchMarkdownFileItems(DOCS_DIR),
      onFileClick: (fileId) => loadDoc(fileId),
    },
    statusbar: true,
    storage: {
      upload: async (file, context) => {
        console.log(`模拟上传: ${file.name}, 大小: ${file.size} 字节`);
        console.log(
          `上传来源: ${context.source}, 弹窗类型: ${context.dialogType}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return {
          url: "https://api.ankio.net/picsum",
          name: file.name,
        };
      },
    },
    editor: {
      value:
        "加载中…\n\n请从左侧打开文档，或等待 AI 演示区加载。\n\n" +
        AI_DEMO_ONLY,
      lineNumbers: true,
    },
    preview: {
      maxWidth: "600px",
    },
    transformer: {
      inlineParsers: {
        1001: new CustomAtParser(), // 注入自定义语法，优先级为 1001
      },
    },
  });

  // 注入自定义高亮插件到 CodeMirror 实例中
  editor.getEditorView().dispatch({
    effects: StateEffect.appendConfig.of(customAtPlugin),
  });

  setupThemeAndAppearance(editor);

  if (docs.length === 0) {
    editor.setMarkdown(
      "请确保 docs 目录下有 Markdown 文件（pnpm demo 下访问 /docs/?json）\n\n你可以试试输入自定义语法：@@这里是高亮内容@@" +
        AI_DEMO_APPEND,
    );
    return;
  }

  await loadDoc(docs[0].href);

  editor.setMarkdown(
    editor.getMarkdown() +
      "\n\n**自定义语法演示**：试试输入 @@这里是高亮内容@@，或点击工具栏 🚀 按钮。",
  );
}

init();
