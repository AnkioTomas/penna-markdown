import type { EditorView } from "@codemirror/view";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { codeBlockMarkdown } from "@/editor/dialog/CodeBlockDialog.js";
import { collapseMarkdown } from "@/editor/dialog/CollapseDialog.js";
import { frontmatterMarkdown } from "@/editor/dialog/FrontmatterDialog.js";
import { mediaMarkdown } from "@/editor/dialog/MediaDialog.js";
import { timelineMarkdown } from "@/editor/dialog/TimelineDialog.js";
import type {
  CodeBlockVariant,
  CommandContext,
  CommandHandler,
  MediaDialogResult,
} from "./types.js";
import {
  appendHtmlAttr,
  appendToDocumentEnd,
  insertAtDocumentTop,
  toggleInlinePerLine,
  toggleInlineWrap,
} from "./inline.js";
import {
  SNIPPETS,
  alertBlock,
  containerBlock,
  type AlertKind,
} from "./snippets.js";
import { insertSnippet, insertText } from "./utils.js";

function registerSnippet(
  register: (name: string, handler: CommandHandler) => void,
  name: string,
  snippet: string,
  selectFrom?: number,
  selectEnd?: number,
): void {
  register(name, (view) => {
    insertSnippet(view, snippet, selectFrom, selectEnd);
    return true;
  });
}

export function registerThemeCommand(
  register: (name: string, handler: CommandHandler) => void,
): void {
  register("setTheme", (_view, payload, ctx) => {
    const id = String((payload as { id?: string })?.id ?? "");
    const theme = ctx.theme;
    if (!theme) return false;
    const { render, root } = theme.getTheme();
    if (!render || !REGISTERED_THEMES.includes(id as (typeof REGISTERED_THEMES)[number])) {
      return false;
    }
    theme.setTheme(id, render, root ?? undefined);
    return true;
  });
}

export function registerExtendCommands(
  register: (name: string, handler: CommandHandler) => void,
): void {
  register("highlight", (view) => {
    toggleInlineWrap(view, "==", "==", "高亮");
    return true;
  });
  register("spoiler", (view) => {
    toggleInlineWrap(view, "!!", "!!", "剧透");
    return true;
  });
  register("sup", (view) => {
    toggleInlineWrap(view, "^", "^", "上标");
    return true;
  });
  register("sub", (view) => {
    toggleInlineWrap(view, "~", "~", "下标");
    return true;
  });
  register("comment", (view) => {
    toggleInlinePerLine(view, "%%", "%%", "注释");
    return true;
  });
  register("math", (view) => {
    toggleInlineWrap(view, "$", "$", "E=mc^2");
    return true;
  });

  register("htmlAttr", async (view, _payload, ctx) => {
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "attr", { value: ".highlight" });
    if (!data) return false;
    appendHtmlAttr(view, data.attr);
    return true;
  });

  register("alert", (view, payload) => {
    const type = String((payload as { type?: string })?.type ?? "NOTE").toUpperCase() as AlertKind;
    const body = "提示内容";
    const snippet = alertBlock(type, body);
    const start = snippet.indexOf(body);
    insertSnippet(view, snippet, start, start + body.length);
    return true;
  });

  register("container", (view, payload) => {
    const p = payload as { type?: string; title?: string } | undefined;
    const type = p?.type ?? "tip";
    const title = p?.title ?? "标题";
    const body = "容器内容";
    const snippet = containerBlock(type, title, body);
    const start = snippet.indexOf(body);
    insertSnippet(view, snippet, start, start + body.length);
    return true;
  });

  register("emoji", async (view, _p, ctx) => {
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "emoji");
    if (!data?.code) return false;
    insertText(view, data.code);
    return true;
  });

  register("footnoteRef", async (view, _p, ctx) => {
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "footnote", { mode: "ref" });
    if (!data) return false;
    return applyFootnote(view, data.id, data.content, data.mode);
  });

  register("footnoteDef", async (view, _p, ctx) => {
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "footnote", { mode: "def" });
    if (!data) return false;
    return applyFootnote(view, data.id, data.content, data.mode);
  });

  register("footnote", async (view, _p, ctx) => {
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "footnote", { mode: "both" });
    if (!data) return false;
    return applyFootnote(view, data.id, data.content, data.mode);
  });

  register("video", (view, _p, ctx) => insertMediaDialog(view, ctx, "video"));
  register("audio", (view, _p, ctx) => insertMediaDialog(view, ctx, "audio"));
  register("iframe", (view, _p, ctx) => insertMediaDialog(view, ctx, "iframe"));
  register("image", (view, _p, ctx) => insertMedia(view, ctx, "image"));

  register("codeBlock", (view, payload, ctx) =>
    insertCodeBlockDialog(view, ctx, (payload as { variant?: CodeBlockVariant })?.variant ?? "basic"),
  );

  register("frontmatter", async (view, _p, ctx) => {
    if (!ctx?.theme) return false;
    const doc = view.state.doc.toString();
    const match = doc.match(/^---\n([\s\S]*?)\n---/);
    const data = await requestDialog(ctx.theme, "frontmatter", { yaml: match?.[1] ?? undefined });
    if (!data) return false;
    insertAtDocumentTop(view, frontmatterMarkdown(data.yaml));
    return true;
  });

  register("collapse", async (view, _p, ctx) => {
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "collapse");
    if (!data) return false;
    insertSnippet(view, collapseMarkdown(data));
    return true;
  });

  register("timeline", async (view, payload, ctx) => {
    const preset = payload as {
      title?: string;
      time?: string;
      type?: string;
      lineStyle?: string;
      containerLine?: string;
      content?: string;
      custom?: boolean;
    } | undefined;
    if (preset?.title && !preset.custom) {
      insertSnippet(
        view,
        timelineMarkdown(
          {
            title: preset.title,
            time: preset.time ?? "2024-01",
            type: preset.type ?? "success",
            lineStyle: preset.lineStyle ?? "",
            content: preset.content ?? "事件说明",
          },
          preset.containerLine ?? "",
        ),
      );
      return true;
    }
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "timeline", preset ?? {});
    if (!data) return false;
    insertSnippet(view, timelineMarkdown(data));
    return true;
  });

  registerSnippet(register, "tabs", SNIPPETS.tabs, 14, 18);
  registerSnippet(register, "steps", SNIPPETS.steps, 8, 12);
  registerSnippet(register, "card", SNIPPETS.card, 12, 16);
  registerSnippet(register, "linkCard", SNIPPETS.linkCard, 52, 56);
  registerSnippet(register, "imageCard", SNIPPETS.imageCard, 70, 74);
  registerSnippet(register, "repoCard", SNIPPETS.repoCard, 20, 24);
  registerSnippet(register, "cardGrid", SNIPPETS.cardGrid, 40, 44);
  registerSnippet(register, "cardMasonry", SNIPPETS.cardMasonry, 50, 54);
  registerSnippet(register, "field", SNIPPETS.field, 18, 26);
  registerSnippet(register, "fieldGroup", SNIPPETS.fieldGroup, 20, 24);
  registerSnippet(register, "mathBlock", SNIPPETS.mathBlock, 3, 10);
  registerSnippet(register, "commentBlock", SNIPPETS.commentBlock, 4, 6);

  register("mermaid", (view, payload) => {
    const kind = String((payload as { kind?: string })?.kind ?? "flowchart");
    const map: Record<string, keyof typeof SNIPPETS> = {
      flowchart: "mermaidFlowchart",
      sequence: "mermaidSequence",
      class: "mermaidClass",
      state: "mermaidState",
      pie: "mermaidPie",
      gantt: "mermaidGantt",
    };
    const snippet = SNIPPETS[map[kind] ?? "mermaid"];
    insertSnippet(view, snippet);
    return true;
  });

  register("echarts", (view, payload) => {
    const kind = String((payload as { kind?: string })?.kind ?? "bar");
    const map: Record<string, keyof typeof SNIPPETS> = {
      bar: "echarts",
      line: "echartsLine",
      pie: "echartsPie",
    };
    insertSnippet(view, SNIPPETS[map[kind] ?? "echarts"]);
    return true;
  });

  registerSnippet(register, "taskInProgress", SNIPPETS.taskInProgress, 6, 9);
  registerSnippet(register, "taskDeferred", SNIPPETS.taskDeferred, 6, 8);
  registerSnippet(register, "taskEarly", SNIPPETS.taskEarly, 6, 8);
  registerSnippet(register, "taskCancelled", SNIPPETS.taskCancelled, 6, 8);
  registerSnippet(register, "taskUrgent", SNIPPETS.taskUrgent, 6, 8);
}

function applyFootnote(
  view: EditorView,
  id: string,
  content: string | undefined,
  mode: "ref" | "def" | "both",
): boolean {
  if (mode === "ref" || mode === "both") {
    insertText(view, `[^${id}]`);
  }
  if (mode === "def" || mode === "both") {
    appendToDocumentEnd(view, `[^${id}]: ${content ?? "脚注内容"}\n`);
  }
  return true;
}

async function insertMediaDialog(
  view: EditorView,
  ctx: CommandContext | undefined,
  kind: MediaDialogResult["kind"],
): Promise<boolean> {
  if (!ctx?.theme) return false;
  const { from, to, empty } = view.state.selection.main;
  const selected = empty ? "" : view.state.sliceDoc(from, to);
  const data = await requestDialog(ctx.theme, "media", {
    kind,
    label: selected || undefined,
  });
  if (!data?.url) return false;
  insertText(view, mediaMarkdown(data));
  return true;
}

async function insertCodeBlockDialog(
  view: EditorView,
  ctx: CommandContext | undefined,
  variant: CodeBlockVariant,
): Promise<boolean> {
  if (!ctx?.theme) return false;
  const { from, to, empty } = view.state.selection.main;
  const selected = empty ? "" : view.state.sliceDoc(from, to);
  const data = await requestDialog(ctx.theme, "codeBlock", {
    variant,
    code: selected || undefined,
  });
  if (!data) return false;
  if (selected && !empty) {
    insertText(view, codeBlockMarkdown({ ...data, code: selected }));
    return true;
  }
  insertSnippet(view, codeBlockMarkdown(data));
  return true;
}

async function insertMedia(
  view: EditorView,
  ctx: CommandContext | undefined,
  kind: "image",
): Promise<boolean> {
  if (!ctx?.theme) return false;
  const { from, to, empty } = view.state.selection.main;
  const selected = empty ? "" : view.state.sliceDoc(from, to);
  const data = await requestDialog(ctx.theme, "link", {
    text: selected || "alt",
    url: "",
  });
  if (!data?.url) return false;
  const alt = data.text || "alt";
  const title = data.title ? ` "${data.title}"` : "";
  insertText(view, `![${alt}](${data.url}${title})`);
  return true;
}
