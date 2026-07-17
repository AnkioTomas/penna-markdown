/**
 * 编辑命令注册表与统一入口。
 *
 * - {@link COMMANDS} — 命令名 → 实例映射，Toolbar / 快捷键 / `penna.runCommand()` 均通过此表调度
 * - {@link runCommand} — 执行命令的唯一入口
 * - {@link DIALOG_RENDERERS} — 从带弹窗命令收集的渲染器，供 DialogHost 使用
 */
import type { EditorView } from "@codemirror/view";
import type { Command } from "@/editor/commands/Command";
import {
  buildDialogRenderers,
  type DialogRenderer,
} from "@/editor/commands/DialogCommand";
import { renderAICustomDialog } from "@/editor/ai/AICustomDialog.js";
import type { DialogType } from "@/editor/commands/dialogTypes.js";
import {
  boldCommand,
  italicCommand,
  strikethroughCommand,
  codeCommand,
  highlightCommand,
  highlightNoteCommand,
  highlightTipCommand,
  highlightWarningCommand,
  highlightCautionCommand,
  highlightDangerCommand,
  highlightImportantCommand,
  spoilerCommand,
  supCommand,
  subCommand,
  commentCommand,
  mathCommand,
} from "@/editor/commands/groups/InlineWrapCommand";
import {
  blockquoteCommand,
  unorderedListCommand,
  orderedListCommand,
} from "@/editor/commands/groups/LinePrefixCommand";
import { horizontalRuleCommand } from "@/editor/commands/groups/HorizontalRuleCommand";
import {
  taskListCommand,
  taskInProgressCommand,
  taskDeferredCommand,
  taskEarlyCommand,
  taskCancelledCommand,
  taskUrgentCommand,
  taskDoneCommand,
} from "@/editor/commands/groups/TaskCommand";
import {
  codeBlockBasicCommand,
  codeBlockTitleCommand,
  codeBlockHighlightCommand,
  codeBlockCollapseCommand,
} from "@/editor/commands/groups/CodeBlockCommand";
import {
  linkCommand,
  imageCommand,
  linkReferenceCommand,
  linkRefDefCommand,
} from "@/editor/commands/groups/LinkCommand";
import { tableCommand } from "@/editor/commands/groups/TableCommand";
import {
  videoCommand,
  audioCommand,
  iframeCommand,
} from "@/editor/commands/groups/MediaCommand";
import {
  badgeCommand,
  applyBadge,
} from "@/editor/commands/groups/BadgeCommand";
import {
  footnoteRefCommand,
  footnoteDefCommand,
  footnoteBothCommand,
} from "@/editor/commands/groups/FootnoteCommand";
import { emojiCommand } from "@/editor/commands/groups/EmojiCommand";
import { htmlAttrCommand } from "@/editor/commands/groups/HtmlAttrCommand";
import {
  frontmatterCommand,
  frontmatterVarCommand,
} from "@/editor/commands/groups/FrontmatterCommand";
import {
  alertNoteCommand,
  alertTipCommand,
  alertImportantCommand,
  alertWarningCommand,
  alertCautionCommand,
} from "@/editor/commands/groups/AlertCommand";
import {
  containerTipCommand,
  containerWarningCommand,
  containerNoteCommand,
  containerInfoCommand,
  containerImportantCommand,
  containerCautionCommand,
  containerDangerCommand,
  containerCenterCommand,
  containerLeftCommand,
  containerRightCommand,
  containerJustifyCommand,
} from "@/editor/commands/groups/ContainerCommand";
import {
  collapseDefaultCommand,
  collapseExpandedCommand,
  collapseExpandCommand,
} from "@/editor/commands/groups/CollapseCommand";
import { tabsCommand } from "@/editor/commands/groups/TabsCommand";
import { stepsCommand } from "@/editor/commands/groups/StepsCommand";
import {
  cardCommand,
  linkCardCommand,
  imageCardCommand,
  repoCardCommand,
  cardGridCommand,
  cardMasonryCommand,
} from "@/editor/commands/groups/CardCommand";
import {
  fieldCommand,
  fieldGroupCommand,
} from "@/editor/commands/groups/FieldCommand";
import {
  timelineContainerCommand,
  timelineNodeCommand,
} from "@/editor/commands/groups/TimelineCommand";
import { mermaidCommand } from "@/editor/commands/groups/MermaidCommand";
import { echartsCommand } from "@/editor/commands/groups/EchartsCommand";
import { mathBlockCommand } from "@/editor/commands/groups/MathBlockCommand";
import { commentBlockCommand } from "@/editor/commands/groups/CommentBlockCommand";
import {
  setThemeCommand,
  createThemeCommand,
} from "@/editor/commands/groups/SetThemeCommand";
import { insertTextCommand } from "@/editor/commands/groups/InsertTextCommand";
import { AI_COMMANDS } from "@/editor/commands/groups/AICommand";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";
import {
  heading1Command,
  heading2Command,
  heading3Command,
  heading4Command,
  heading5Command,
  heading6Command,
} from "@/editor/commands/groups/HeadingCommand";

export type { EditorCommand } from "@/editor/commands/Command";

const THEME_COMMANDS = Object.fromEntries(
  REGISTERED_THEMES.map((id) => [`theme-${id}`, createThemeCommand(id)]),
);

/**
 * 内置命令注册表。
 * 键名与工具栏项 `id` 一致，Toolbar / 快捷键 / `penna.runCommand()` 均通过此表调度。
 */
export const COMMANDS: Record<string, Command> = {
  /* ---- 行内标记 (groups/InlineWrapCommand) ---- */
  bold: boldCommand,
  italic: italicCommand,
  strikethrough: strikethroughCommand,
  code: codeCommand,
  highlight: highlightCommand,
  highlightNote: highlightNoteCommand,
  highlightTip: highlightTipCommand,
  highlightWarning: highlightWarningCommand,
  highlightCaution: highlightCautionCommand,
  highlightDanger: highlightDangerCommand,
  highlightImportant: highlightImportantCommand,
  spoiler: spoilerCommand,
  sup: supCommand,
  sub: subCommand,
  comment: commentCommand,
  math: mathCommand,
  /* ---- 文档结构 ---- */
  heading1: heading1Command,
  heading2: heading2Command,
  heading3: heading3Command,
  heading4: heading4Command,
  heading5: heading5Command,
  heading6: heading6Command,
  blockquote: blockquoteCommand,
  unorderedList: unorderedListCommand,
  orderedList: orderedListCommand,
  horizontalRule: horizontalRuleCommand,
  /* ---- 任务列表 (groups/TaskCommand) ---- */
  taskList: taskListCommand,
  taskInProgress: taskInProgressCommand,
  taskDeferred: taskDeferredCommand,
  taskEarly: taskEarlyCommand,
  taskCancelled: taskCancelledCommand,
  taskUrgent: taskUrgentCommand,
  taskDone: taskDoneCommand,
  /* ---- 代码块 (groups/CodeBlockCommand)，弹窗 type: codeBlock ---- */
  codeBlockBasic: codeBlockBasicCommand,
  codeBlockTitle: codeBlockTitleCommand,
  codeBlockHighlight: codeBlockHighlightCommand,
  codeBlockCollapse: codeBlockCollapseCommand,
  /* ---- 链接 / 媒体 / 表格，均带弹窗 ---- */
  link: linkCommand,
  image: imageCommand,
  linkReference: linkReferenceCommand,
  linkRefDef: linkRefDefCommand,
  table: tableCommand,
  video: videoCommand,
  audio: audioCommand,
  iframe: iframeCommand,
  /* ---- 徽章 / 脚注 / Emoji / 属性 / Frontmatter ---- */
  badge: badgeCommand,
  footnoteRef: footnoteRefCommand,
  footnoteDef: footnoteDefCommand,
  footnoteBoth: footnoteBothCommand,
  emoji: emojiCommand,
  htmlAttr: htmlAttrCommand,
  frontmatter: frontmatterCommand,
  frontmatterVar: frontmatterVarCommand,
  /* ---- GFM 告警 (groups/AlertCommand) ---- */
  alertNote: alertNoteCommand,
  alertTip: alertTipCommand,
  alertImportant: alertImportantCommand,
  alertWarning: alertWarningCommand,
  alertCaution: alertCautionCommand,
  /* ---- 自定义容器 (groups/ContainerCommand) ---- */
  containerTip: containerTipCommand,
  containerWarning: containerWarningCommand,
  containerNote: containerNoteCommand,
  containerInfo: containerInfoCommand,
  containerImportant: containerImportantCommand,
  containerCaution: containerCautionCommand,
  containerDanger: containerDangerCommand,
  containerCenter: containerCenterCommand,
  containerLeft: containerLeftCommand,
  containerRight: containerRightCommand,
  containerJustify: containerJustifyCommand,
  /* ---- 折叠面板 (groups/CollapseCommand) ---- */
  collapseDefault: collapseDefaultCommand,
  collapseExpanded: collapseExpandedCommand,
  collapseExpand: collapseExpandCommand,
  /* ---- 标签页 / 步骤 ---- */
  tabs: tabsCommand,
  steps: stepsCommand,
  /* ---- 卡片 (groups/CardCommand) ---- */
  card: cardCommand,
  linkCard: linkCardCommand,
  imageCard: imageCardCommand,
  repoCard: repoCardCommand,
  cardGrid: cardGridCommand,
  cardMasonry: cardMasonryCommand,
  /* ---- 表单字段 (groups/FieldCommand) ---- */
  field: fieldCommand,
  fieldGroup: fieldGroupCommand,
  /* ---- 时间线 (groups/TimelineCommand) ---- */
  timelineContainer: timelineContainerCommand,
  timelineNode: timelineNodeCommand,
  /* ---- 图表 ---- */
  mermaid: mermaidCommand,
  echarts: echartsCommand,
  /* ---- 块级公式 / 注释 ---- */
  mathBlock: mathBlockCommand,
  commentBlock: commentBlockCommand,
  /* ---- 主题 / 通用插入 / AI ---- */
  setTheme: setThemeCommand,
  insertText: insertTextCommand,
  ...AI_COMMANDS,
  ...THEME_COMMANDS,
};

/** 从 {@link COMMANDS} 收集的弹窗渲染器，键为 {@link DialogType}。 */
export const DIALOG_RENDERERS: Partial<Record<DialogType, DialogRenderer>> = {
  ...buildDialogRenderers(COMMANDS),
  aiCustom: renderAICustomDialog,
};

/** 返回所有已注册命令名列表。 */
export function listCommands(): string[] {
  return Object.keys(COMMANDS);
}

/**
 * 执行编辑命令。
 * @param view - CodeMirror 编辑器实例
 * @param command - 命令名，须存在于 {@link COMMANDS}
 * @param payload - 可选参数（如 insertText 的文本、setTheme 的 id）
 * @param ctx - 上下文；弹窗命令须传入 `{ eventBus }`，主题命令须传入 `{ theme }`
 * @returns 命令不存在返回 false；弹窗命令可能返回 Promise
 */
export function runCommand(
  view: EditorView,
  command: string,
  payload?: unknown,
  ctx?: import("./Command.js").CommandContext,
): boolean | Promise<boolean> {
  const handler = COMMANDS[command];
  if (!handler) return false;
  view.focus();
  return handler.execute(view, payload, ctx ?? {});
}
