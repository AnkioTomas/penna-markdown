/**
 * 对话框类型定义。
 *
 * 与 `requestDialog(theme, type)` 配合，提供类型安全的提交结果推断。
 */
import type { TableDialogResult } from "@/editor/commands/groups/TableCommand";
import type { LinkDialogResult } from "@/editor/commands/groups/LinkCommand";
import type { BadgeDialogResult } from "@/editor/commands/groups/BadgeCommand";
import type { MediaDialogResult } from "@/editor/commands/groups/MediaCommand";
import type { EmojiDialogResult } from "@/editor/commands/groups/EmojiCommand";

import type { FootnoteDialogResult } from "@/editor/commands/groups/FootnoteCommand";
import type { CodeBlockDialogResult } from "@/editor/commands/groups/CodeBlockCommand";
import type { FrontmatterDialogResult } from "@/editor/commands/groups/FrontmatterCommand";
import type {
  TimelineNodeDialogResult,
  TimelineContainerDialogResult,
} from "@/editor/commands/groups/TimelineCommand";
import type { CardDialogResult } from "@/editor/commands/groups/CardCommand";
import type { FieldDialogResult } from "@/editor/commands/groups/FieldCommand";
import type { MermaidDialogResult } from "@/editor/commands/groups/MermaidCommand";
import type { EchartsDialogResult } from "@/editor/commands/groups/EchartsCommand";

/** 所有内置弹窗的类型 id。 */
export type DialogType =
  | "table"
  | "link"
  | "badge"
  | "media"
  | "emoji"
  | "footnoteRef"
  | "footnoteDef"
  | "footnoteBoth"
  | "codeBlock"
  | "frontmatter"
  | "timelineNode"
  | "timelineContainer"
  | "card"
  | "field"
  | "mermaid"
  | "echarts";

/** 各弹窗类型对应的提交结果数据结构。 */
export type DialogResultMap = {
  table: TableDialogResult;
  link: LinkDialogResult;
  badge: BadgeDialogResult;
  media: MediaDialogResult;
  emoji: EmojiDialogResult;
  footnoteRef: FootnoteDialogResult;
  footnoteDef: FootnoteDialogResult;
  footnoteBoth: FootnoteDialogResult;
  codeBlock: CodeBlockDialogResult;
  frontmatter: FrontmatterDialogResult;
  timelineNode: TimelineNodeDialogResult;
  timelineContainer: TimelineContainerDialogResult;
  card: CardDialogResult;
  field: FieldDialogResult;
  mermaid: MermaidDialogResult;
  echarts: EchartsDialogResult;
};
