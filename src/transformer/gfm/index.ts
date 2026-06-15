/**
 * @file GFM 内置语法注册
 * @module transformer/gfm/builtin
 *
 * 键为 priority（唯一，≥0，越大越先匹配），值为 parser。
 * 百位为语义分层，同层内以 10 递增/递减区分先后（如 330 > 320 > 310）。
 */

import autolink from "@/transformer/gfm/inline/autolinks.js";
import entity from "@/transformer/gfm/inline/entity.js";
import text from "@/transformer/gfm/inline/text.js";
import codeSpan from "@/transformer/gfm/inline/code.js";
import emphasis from "@/transformer/gfm/inline/emphasis.js";
import strikethrough from "@/transformer/gfm/inline/strikethrough.js";
import setextHeading from "@/transformer/gfm/block/setext_heading";
import atxHeading from "@/transformer/gfm/block/atx_heading";
import blockquote from "@/transformer/gfm/block/blockquote.js";
import code from "@/transformer/gfm/block/code.js";
import indentedCode from "@/transformer/gfm/block/indented-code.js";
import hr from "@/transformer/gfm/block/hr.js";
import list from "@/transformer/gfm/block/list.js";
import table from "@/transformer/gfm/block/table.js";
import paragraph from "@/transformer/gfm/block/paragraph.js";
import linkRef from "@/transformer/gfm/block/link-reference-definition.js";
import links from "@/transformer/gfm/inline/links.js";
import linkReferenceValue from "@/transformer/gfm/inline/link-reference-value.js";
import __break from "@/transformer/gfm/inline/break.js";
import images from "@/transformer/gfm/inline/images.js";
import rawhtmlInline from "@/transformer/gfm/inline/html.js";
import rawhtmlBlock from "@/transformer/gfm/block/html.js";
import strong from "@/transformer/gfm/inline/strong";
import type { BaseBlockParser, BaseInlineParser } from "@/transformer/core/ParserBase.js";

/** 默认行内语法 */
export const gfmInlineSyntax: Record<number,BaseInlineParser> = {
  // 900：字面/定界
  900: strikethrough,
  890: codeSpan,
  // 800：换行
  800: __break,
  // 600：实体
  600: entity,
  // 300：强调
  330: strong,
  320: emphasis,
  // 200：链接与图片
  230: images,
  225: linkReferenceValue,
  220: links,
  // 100：HTML / autolink
  120: rawhtmlInline,
  110: autolink,
  // 0：兜底
  0: text,
};

/** 默认块级语法 */
export const gfmBlockSyntax: Record<number,BaseBlockParser> = {
  // 900：分隔线
  900: hr,
  // 800：表格
  800: table,
  // 500：引用
  500: blockquote,
  // 400：HTML / 围栏代码 / 缩进代码 / 链接定义
  430: rawhtmlBlock,
  420: code,
  410: indentedCode,
  400: linkRef,
  // 300：标题 / 列表（列表须高于 setext，GFM Example 64/69）
  320: atxHeading,
  315: list,
  310: setextHeading,
  // 0：兜底
  0: paragraph,
};
