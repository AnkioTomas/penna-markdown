import "../../_common/penna-demo.scss";
import "../../_common/layout.scss";

import { Penna, DEFAULT_TOOLBAR_ITEMS } from "@/editor/Penna.js";
import type { StorageAPI } from "@/core/StorageAPI.js";
import type { PennaFileItem } from "@/editor/sidebar/SideBarOptions.js";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";
import { setupThemeAndAppearance } from "../../_common/theme.js";
import {
  fetchDocsList,
  fetchDocContent,
  fetchMarkdownFileItems,
} from "../../_common/api.js";

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import type { InlineParseResult } from "@/transformer/core/ParserBase.js";

const DOCS_DIR = "/docs/";

const VIRTUAL = {
  options: "virtual:options",
  ai: "virtual:ai",
  custom: "virtual:custom",
} as const;

// ==========================================
// 自定义行内语法：@@text@@
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
    _ctx: InlineParseContext,
  ): InlineParseResult | null {
    const start = index + 2;
    const end = src.indexOf("@@", start);
    if (end < 0) return null;
    const text = src.slice(start, end);
    return {
      node: createNode("custom_at", end - index + 2, undefined, undefined, {
        text,
      }),
      nextIndex: end + 2,
    };
  }

  override render(node: MarkdownNode, _ctx: RenderContext): string {
    const text = (node.props?.text as string) || "";
    return `<span style="color:#007aff;font-weight:bold;background:rgba(0,122,255,.1);padding:0 4px;border-radius:4px;">@${text}</span>`;
  }
}

// ==========================================
// 演示文档
// ==========================================
const OPTIONS_GUIDE = `---
title: 编辑器 Options 导览
subtitle: PennaOptions 全量演示
version: 0.1.0
---

# [[title]]

> [[subtitle]] — 本页说明当前 Demo **已经启用** 的构造选项；语法样例见侧栏 \`simple\` / \`test\`。

## 已启用的 PennaOptions

| 选项 | 本 Demo 取值 | 作用 |
| --- | --- | --- |
| \`layout\` | \`"split"\` | 初始分栏；可用工具栏切换 edit / preview / split |
| \`appearance\` | 顶栏明暗控件 | \`light\` / \`dark\` / 跟随系统 |
| \`themeId\` | 顶栏主题控件 | 初始皮肤 id |
| \`themes\` | 全部内置主题 | 工具栏主题菜单白名单 |
| \`debug\` | \`true\` | 打开调试日志；状态栏显示渲染耗时 |
| \`toolbar\` | 默认表 + 自定义按钮 + \`onClick\` | \`items\` 整表替换；展开 \`DEFAULT_TOOLBAR_ITEMS\` 再追加 |
| \`sidebar\` | 文件列表 + 大纲 | \`fetchFiles\` / \`onFileClick\` / \`maxWidth\` |
| \`statusbar\` | \`true\` | 底部字数 / 选区 / 调试信息 |
| \`storage\` | 带前缀的 localStorage | 持久化分栏比例等 |
| \`editor.value\` | 加载占位文案 | 初始 Markdown |
| \`editor.lineNumbers\` | \`true\` | 编辑区行号 |
| \`editor.onAiRequest\` | mock AI | 启用 AI 工具栏与行级 diff |
| \`editor.onParseFile\` | mock 上传 | 粘贴/拖入图片等文件 |
| \`preview.maxWidth\` | \`"720px"\` | **仅预览布局**下限制预览宽度 |
| \`preview.transformerEngineOptions.inlineParsers\` | \`CustomAtParser\` | 注入自定义行内语法 |

## 建议体验路径

1. 侧栏打开 **simple** — GFM + Penna 扩展语法全集（精简）
2. 侧栏打开 **test** — 边界 / 压力 / 回归活文档
3. 侧栏打开 **AI Diff 演示** — 选区润色后逐块确认
4. 侧栏打开 **自定义语法** — 预览区渲染 \`@@text@@\`
5. 工具栏切换布局，确认 \`preview.maxWidth\` 只在预览模式生效
6. 拖一张图片进编辑区，观察 \`onParseFile\` 上传占位

## 工具栏命令覆盖面

默认工具栏已覆盖：强调、标题、列表、引用、表格、链接/图、代码、Alert、容器、Tabs/Steps/Timeline、卡片、Mermaid/ECharts、媒体、脚注、Frontmatter、主题与布局、AI。可逐一点开插入语法，再对照预览。
`;

const AI_DEMO = `# AI Diff 演示

> 选中一段文字只处理选区；不选则处理全文。AI 返回**修改后的正文**，编辑器展示行级 diff；未全部确认前禁止编辑。

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

const CUSTOM_SYNTAX_DEMO = `# 自定义语法演示

通过 \`preview.transformerEngineOptions.inlineParsers\` 注入 \`@@text@@\` 解析器（预览区生效）。

试试：@@这里是高亮内容@@

也可混排：**粗体**、==高亮==、\`code\`、@@自定义标记@@。
`;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function ensureChanged(text: string, result: string): string {
  if (result !== text) return result;
  if (!text.trim()) return text;
  return text.endsWith("\n") ? `${text} ` : `${text}\n`;
}

/** 模拟 AI：返回替换后的文档片段 */
async function mockAIRequest(
  action: string,
  text: string,
  prompts?: string,
  onUpdate?: (content: string, thinking?: string) => void,
): Promise<string> {
  if (onUpdate) {
    onUpdate("", "AI思考中...");
  }
  await delay(600 + Math.random() * 400);

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

  result = ensureChanged(text, result);

  if (onUpdate) {
    onUpdate("", "AI生成中...");
    let current = "";
    for (let i = 0; i < result.length; i++) {
      current += result[i];
      onUpdate(current, "AI生成中...");
      await delay(10 + Math.random() * 20);
    }
  }

  return result;
}

async function localAIRequest(
  action: string,
  text: string,
  prompts?: string,
  onUpdate?: (content: string, thinking?: string) => void,
): Promise<string> {
  const switchEl = document.getElementById(
    "local-ai-switch",
  ) as HTMLInputElement | null;
  if (!switchEl?.checked) {
    return mockAIRequest(action, text, prompts, onUpdate);
  }

  let prompt = `你是一个 Markdown 编辑器 AI 助手。请根据提供的操作和文本直接输出修改后的内容，不要包含额外的解释或 Markdown 代码块包裹。\n`;
  prompt += `操作指令：${action}\n`;
  if (prompts) prompt += `补充说明：${prompts}\n`;
  prompt += `目标文本：\n${text}`;

  if (onUpdate) onUpdate("", "正在连接本地AI...");

  try {
    const response = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "GLM-4.7-Flash-MLX-8bit",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 返回错误状态：${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let contentResult = "";
    let thinkingResult = "";
    let buffer = "";

    if (!reader) throw new Error("无法读取响应流");

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // 处理最后可能残留的 buffer
        if (buffer.trim().startsWith("data: ") && !buffer.includes("[DONE]")) {
          try {
            const data = JSON.parse(buffer.slice(6).trim());
            if (data.choices && data.choices[0].delta?.content)
              contentResult += data.choices[0].delta.content;
            if (data.choices && data.choices[0].delta?.reasoning_content)
              thinkingResult += data.choices[0].delta.reasoning_content;
          } catch (e) {}
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // 最后一行可能是不完整的，留到下一个 chunk
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]")
          continue;

        try {
          const data = JSON.parse(trimmed.slice(6));
          const delta = data.choices?.[0]?.delta;
          if (!delta) continue;

          let updated = false;
          if (delta.reasoning_content) {
            thinkingResult += delta.reasoning_content;
            updated = true;
          }
          if (delta.content) {
            contentResult += delta.content;
            updated = true;
          }

          if (updated && onUpdate) {
            onUpdate(contentResult, thinkingResult || "正在思考...");
          }
        } catch (e) {
          // ignore partial json
        }
      }
    }

    return ensureChanged(text, contentResult);
  } catch (err: any) {
    console.error("Local AI 请求失败，回退到 Mock", err);
    return mockAIRequest(action, text, prompts, onUpdate);
  }
}

/** Demo 专用存储：与其它页面隔离，仍持久化分栏比例 */
function createDemoStorage(): StorageAPI {
  const prefix = "penna-editor-demo:";
  return {
    getItem(key) {
      try {
        return localStorage.getItem(prefix + key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(prefix + key, value);
      } catch {
        /* 隐私模式等忽略 */
      }
    },
  };
}

function virtualFile(
  id: string,
  title: string,
  summary: string,
): PennaFileItem {
  return {
    id,
    title,
    updateTime: "Demo",
    summary,
  };
}

function preferSimpleFirst(items: PennaFileItem[]): PennaFileItem[] {
  const rank = (id: string) => {
    if (id.endsWith("/simple.md")) return 0;
    if (id.endsWith("/test.md")) return 1;
    return 2;
  };
  return [...items].sort((a, b) => {
    const d = rank(a.id) - rank(b.id);
    return d !== 0 ? d : a.title.localeCompare(b.title, "zh");
  });
}

async function init() {
  const docs = await fetchDocsList(DOCS_DIR);
  let editor: Penna;

  async function resolveContent(fileId: string): Promise<string> {
    switch (fileId) {
      case VIRTUAL.options:
        return OPTIONS_GUIDE;
      case VIRTUAL.ai:
        return AI_DEMO;
      case VIRTUAL.custom:
        return CUSTOM_SYNTAX_DEMO;
      default:
        return fetchDocContent(fileId);
    }
  }

  async function loadDoc(fileId: string) {
    editor.setMarkdown(await resolveContent(fileId));
    editor.setSidebarActiveFile(fileId);
  }

  editor = new Penna(document.querySelector("#penna-editor")!, {
    layout: "split",
    appearance: "light",
    themeId: "default",
    /** 显式传入白名单 = 工具栏主题菜单可见项 */
    themes: [...REGISTERED_THEMES],
    debug: true,
    storage: createDemoStorage(),
    statusbar: true,

    toolbar: {
      items: [
        ...DEFAULT_TOOLBAR_ITEMS,
        {
          id: "custom-btn",
          type: "button",
          label: "🚀 起飞",
          title: "自定义工具栏按钮（toolbar.items）",
          onClick: (ctx) => {
            alert("toolbar.items[].onClick：自定义按钮被点击");
            ctx.focus();
          },
        },
      ],
      onClick: (id) => {
        if (id === "custom-btn") return;
        console.info("[demo] toolbar.onClick", id);
      },
    },

    sidebar: {
      maxWidth: 320,
      fetchFiles: async () => {
        const real = (await fetchMarkdownFileItems(DOCS_DIR)).filter(
          (f) => !f.title.startsWith("_"),
        );
        return [
          virtualFile(VIRTUAL.options, "Options 导览", "PennaOptions 全量说明"),
          virtualFile(VIRTUAL.ai, "AI Diff 演示", "行级 diff / 逐块确认"),
          virtualFile(
            VIRTUAL.custom,
            "自定义语法 @@",
            "inlineParsers 预览渲染",
          ),
          ...preferSimpleFirst(real),
        ];
      },
      onFileClick: (fileId) => {
        void loadDoc(fileId);
      },
    },

    editor: {
      value: "加载中…\n\n正在拉取侧栏文档列表。",
      lineNumbers: true,
      onAiRequest: localAIRequest,
      onParseFile: async (file) => {
        console.info(`[demo] onParseFile: ${file.name} (${file.size} bytes)`);
        await delay(800);
        return {
          url: "https://api.ankio.net/picsum",
          msg: file.name,
        };
      },
    },

    preview: {
      /** 仅在纯预览布局下生效 */
      maxWidth: "720px",
      transformerEngineOptions: {
        inlineParsers: {
          1001: new CustomAtParser(),
        },
      },
    },
  });

  setupThemeAndAppearance(editor);

  const defaultId =
    docs.find((d) => d.name === "simple.md")?.href ??
    docs.find((d) => d.name === "test.md")?.href ??
    VIRTUAL.options;

  await loadDoc(defaultId);
}

void init();
