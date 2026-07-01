/**
 * @file Cherry 扩展语法注册
 * @module transformer/extends
 *
 * 键为 priority（唯一，≥0，越大越先匹配），值为 parser。
 * 与 gfm/index.ts 结构一致；按扩展名启用子集见 registry.ts。
 */

import type { BaseBlockParser, BaseInlineParser } from "@/transformer/core/ParserBase.js";

import htmlAttrsInline from "@/transformer/extends/inline/html_attrs.js";
import highlightInline from "@/transformer/extends/inline/highlight.js";
import emojiInline from "@/transformer/extends/inline/emoji.js";
import spoilerInline from "@/transformer/extends/inline/spoiler.js";
import mathInline from "@/transformer/extends/inline/math.js";
import frontmatterVarInline from "@/transformer/extends/inline/frontmatterVar.js";
import footnoteRefInline from "@/transformer/extends/inline/footnoteRef.js";
import mediaInline, {
  iframeBlockParser,
  mediaBlockParser,
} from "@/transformer/extends/inline/media.js";
import inlineComment from "@/transformer/extends/inline/comment.js";
import badgeInline from "@/transformer/extends/inline/badge.js";
import { subInlineParser, supInlineParser } from "@/transformer/extends/inline/supsub.js";

import alertBlock from "@/transformer/extends/block/alert.js";
import taskListParser from "@/transformer/extends/block/taskList.js";
import mathBlockParser from "@/transformer/extends/block/mathBlock.js";
import specialCodeParser from "@/transformer/extends/block/specialCode.js";
import frontmatterBlock from "@/transformer/extends/block/frontmatter.js";
import footnoteDefBlock, {
  footnotesSectionBlockParser,
} from "@/transformer/extends/block/footnoteDef.js";
import containerBlock from "@/transformer/extends/block/container.js";
import tabsBlock from "@/transformer/extends/block/tabs.js";
import stepsBlock from "@/transformer/extends/block/steps.js";
import timelineBlock from "@/transformer/extends/block/timeline.js";
import collapseBlock from "@/transformer/extends/block/collapse.js";
import enhancedCodeParser from "@/transformer/extends/block/enhancedCode.js";
import cardBlockParser from "@/transformer/extends/block/card/card.js";
import { linkCardBlockParser } from "@/transformer/extends/block/card/linkCard.js";
import { imageCardBlockParser } from "@/transformer/extends/block/card/imageCard.js";
import { repoCardBlockParser } from "@/transformer/extends/block/card/repoCard.js";
import { cardGridBlockParser } from "@/transformer/extends/block/card/cardGrid.js";
import { cardMasonryBlockParser } from "@/transformer/extends/block/card/cardMasonry.js";
import { fieldBlockParser } from "@/transformer/extends/block/field/field.js";
import { fieldGroupBlockParser } from "@/transformer/extends/block/field/fieldGroup.js";

/** 全部扩展行内语法 */
export const extendInlineSyntax: Record<number, BaseInlineParser> = {
  230: frontmatterVarInline,
  906: mathInline,
  905: subInlineParser,
  904: supInlineParser,
  49: highlightInline,
  31: htmlAttrsInline,
  415: badgeInline,
  48: emojiInline,
  50: spoilerInline,
  55: inlineComment,
  235: footnoteRefInline,
  231: mediaInline,
};

/** 全部扩展块级语法 */
export const extendBlockSyntax: Record<number, BaseBlockParser> = {
  910: frontmatterBlock,
  905: mathBlockParser,
  405: footnoteDefBlock,
  1: footnotesSectionBlockParser,
  84: iframeBlockParser,
  83: mediaBlockParser,
  510: alertBlock,
  316: taskListParser,
  110: enhancedCodeParser,
  109: specialCodeParser,
  87: containerBlock,
  96: cardMasonryBlockParser,
  97: timelineBlock,
  98: collapseBlock,
  95: cardGridBlockParser,
  94: repoCardBlockParser,
  93: imageCardBlockParser,
  92: linkCardBlockParser,
  91: cardBlockParser,
  90: fieldBlockParser,
  89: stepsBlock,
  88: tabsBlock,
  82: fieldGroupBlockParser,
};

