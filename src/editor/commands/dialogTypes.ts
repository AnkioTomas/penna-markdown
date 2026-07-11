/**
 * 对话框类型定义。
 *
 * 与 `requestDialog(eventBus, type)` 配合，提供类型安全的提交结果推断。
 */
import type { TableDialogResult } from "@/editor/commands/groups/TableCommand";
import type {
  LinkDialogResult,
  ImageDialogResult,
  LinkReferenceDialogResult,
  LinkRefDefDialogResult,
} from "@/editor/commands/groups/LinkCommand";
import type { BadgeDialogResult } from "@/editor/commands/groups/BadgeCommand";
import type { MediaDialogResult } from "@/editor/commands/groups/MediaCommand";
import type { EmojiDialogResult } from "@/editor/commands/groups/EmojiCommand";

import type { FootnoteDialogResult } from "@/editor/commands/groups/FootnoteCommand";
import type { CodeBlockDialogResult } from "@/editor/commands/groups/CodeBlockCommand";
import type {
  FrontmatterDialogResult,
  FrontmatterVarDialogResult,
} from "@/editor/commands/groups/FrontmatterCommand";
import type {
  TimelineNodeDialogResult,
  TimelineContainerDialogResult,
} from "@/editor/commands/groups/TimelineCommand";
import type { CardDialogResult } from "@/editor/commands/groups/CardCommand";
import type { FieldDialogResult } from "@/editor/commands/groups/FieldCommand";
import type { MermaidDialogResult } from "@/editor/commands/groups/MermaidCommand";
import type { EchartsDialogResult } from "@/editor/commands/groups/EchartsCommand";
import type { AICustomDialogResult } from "@/editor/ai/AICustomDialog.js";

/** 所有内置弹窗的类型 id。 */
export type DialogType =
  | "table"
  | "link"
  | "image"
  | "linkReference"
  | "linkRefDef"
  | "badge"
  | "media"
  | "emoji"
  | "footnoteRef"
  | "footnoteDef"
  | "footnoteBoth"
  | "codeBlock"
  | "frontmatter"
  | "frontmatterVar"
  | "timelineNode"
  | "timelineContainer"
  | "card"
  | "field"
  | "mermaid"
  | "echarts"
  | "aiCustom";

/** 各弹窗类型对应的提交结果数据结构。 */
export type DialogResultMap = {
  table: TableDialogResult;
  link: LinkDialogResult;
  image: ImageDialogResult;
  linkReference: LinkReferenceDialogResult;
  linkRefDef: LinkRefDefDialogResult;
  badge: BadgeDialogResult;
  media: MediaDialogResult;
  emoji: EmojiDialogResult;
  footnoteRef: FootnoteDialogResult;
  footnoteDef: FootnoteDialogResult;
  footnoteBoth: FootnoteDialogResult;
  codeBlock: CodeBlockDialogResult;
  frontmatter: FrontmatterDialogResult;
  frontmatterVar: FrontmatterVarDialogResult;
  timelineNode: TimelineNodeDialogResult;
  timelineContainer: TimelineContainerDialogResult;
  card: CardDialogResult;
  field: FieldDialogResult;
  mermaid: MermaidDialogResult;
  echarts: EchartsDialogResult;
  aiCustom: AICustomDialogResult;
};
