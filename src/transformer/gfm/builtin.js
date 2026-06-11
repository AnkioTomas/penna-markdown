/**
 * @file GFM 内置语法注册
 * @module transformer/gfm/builtin
 *
 * 导出默认行内/块级解析器列表，并向 Registry 注册 GFM 扩展（如强调定界符 finalizer）。
 */

import escape from "@/transformer/gfm/inline/escape.js";
import autolink from "@/transformer/gfm/inline/autolinks.js";
import entity from "@/transformer/gfm/inline/entity.js";
import text from "@/transformer/gfm/inline/text.js";
import codeSpan from "@/transformer/gfm/inline/code.js";
import emphasis, { renderStrong } from "@/transformer/gfm/inline/emphasis.js";
import strikethrough from "@/transformer/gfm/inline/strikethrough.js";
import heading from "@/transformer/gfm/block/heading.js";
import blockquote from "@/transformer/gfm/block/blockquote.js";
import code from "@/transformer/gfm/block/code.js";
import indentedCode from "@/transformer/gfm/block/indented-code.js";
import hr from "@/transformer/gfm/block/hr.js";
import list from "@/transformer/gfm/block/list.js";
import table from "@/transformer/gfm/block/table.js";
import paragraph from "@/transformer/gfm/block/paragraph.js";
import link_ref from "@/transformer/gfm/block/link-reference-definition.js"
import links from "@/transformer/gfm/inline/links.js";
import __break from "@/transformer/gfm/inline/break.js";
import images from "@/transformer/gfm/inline/images.js";
import rawhtmlInline from "@/transformer/gfm/inline/html.js";
import rawhtmlBlock from "@/transformer/gfm/block/html.js";
import { emphasisInlineFinalizer } from "@/transformer/gfm/inline/delimiters.js";

/** 默认行内语法解析器（按注册顺序） */
export const builtinInlineSyntax = [
  escape,
  images,
  links,
  autolink,
  rawhtmlInline,
  entity,
  codeSpan,
  strikethrough,
  emphasis,
    __break,
  text,
];

/** 默认块级语法解析器（按注册顺序） */
export const builtinBlockSyntax = [
  rawhtmlBlock,
  heading,
  blockquote,
  link_ref,
  code,
  indentedCode,
  hr,
  list,
  table,
  paragraph,
];

/**
 * 向 Registry 注册 GFM 特有扩展（如强调定界符 inline finalizer）。
 *
 * @param {import('@/transformer/core/Registry.js').Registry} registry
 */
export function applyGfmRegistryExtensions(registry) {
  registry.registerInlineFinalizer(emphasisInlineFinalizer);
  registry.registerInlineRenderer("strong", renderStrong);
}
