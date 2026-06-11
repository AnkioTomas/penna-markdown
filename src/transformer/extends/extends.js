/**
 * @file Cherry Markdown 扩展注册与装配
 * @module transformer/extends/extends
 *
 * 将各扩展语法（highlight、footnote、frontmatter 等）的 parser 与 hooks
 * 集中注册，并提供按名称启用扩展、生成 TransformerEngine 选项的工厂函数。
 * 扩展逻辑与 TransformerEngine 核心解耦，通过 afterParse / afterRender 钩子接入。
 */

import { createTransformer } from "@/transformer/index.js";
import htmlAttrsInline from "@/transformer/extends/inline/html_attrs.js";
import highlightInline from "@/transformer/extends/inline/highlight.js";
import emojiInline from "@/transformer/extends/inline/emoji.js";
import alertBlock from "@/transformer/extends/block/alert.js";
import { foldHtmlAttrsInTree } from "@/transformer/extends/postprocess/foldHtmlAttrs.js";
import taskListParser from "@/transformer/extends/block/taskList.js";
import mathBlockParser from "@/transformer/extends/block/mathBlock.js";
import mathInline from "@/transformer/extends/inline/math.js";
import specialCodeParser from "@/transformer/extends/block/specialCode.js";
import frontmatterBlock, {
  attachFrontmatterToRoot,
} from "@/transformer/extends/block/frontmatter.js";
import frontmatterVarInline from "@/transformer/extends/inline/frontmatterVar.js";
import inlineComment from "@/transformer/extends/inline/comment.js";
import badgeInline from "@/transformer/extends/inline/badge.js";
import { subInlineParser, supInlineParser } from "@/transformer/extends/inline/supsub.js";
import containerBlock from "@/transformer/extends/block/container.js";
import { cardBlockParsers } from "@/transformer/extends/block/card/index.js";
import { fieldBlockParsers } from "@/transformer/extends/block/field/index.js";
import tabsBlock from "@/transformer/extends/block/tabs.js";
import stepsBlock from "@/transformer/extends/block/steps.js";
import timelineBlock from "@/transformer/extends/block/timeline.js";
import collapseBlock from "@/transformer/extends/block/collapse.js";
import iframeBlock from "@/transformer/extends/block/iframe.js";
import footnoteDefBlock from "@/transformer/extends/block/footnoteDef.js";
import footnotesSection, {
  finalizeFootnotes,
} from "@/transformer/extends/block/footnotes.js";
import footnoteRefInline from "@/transformer/extends/inline/footnoteRef.js";
import mediaBlock from "@/transformer/extends/block/media.js";
import mediaInline from "@/transformer/extends/inline/media.js";
import spoilerInline from "@/transformer/extends/inline/spoiler.js";
import { injectAttrsIntoFirstOpenTag } from "@/transformer/extends/utils/injectAttrs.js";

/**
 * @typedef {import('@/transformer/core/ParserBase.js').BaseInlineParser} BaseInlineParser
 */

/**
 * @typedef {import('@/transformer/core/ParserBase.js').BaseBlockParser} BaseBlockParser
 */

/**
 * @typedef {import('@/transformer/core/MarkdownNode.js').MarkdownNode} MarkdownNode
 */

/**
 * @typedef {import('@/transformer/core/ParserContext.js').BlockParseContext} BlockParseContext
 */

/**
 * 单节点渲染后钩子上下文（与 TransformerEngine._hookAfter 一致）。
 *
 * @typedef {{
 *   type: 'inline' | 'block',
 *   name: string,
 *   node: MarkdownNode,
 *   html: string
 * }} AfterRenderContext
 */

/**
 * 单节点渲染后钩子。
 *
 * @typedef {(ctx: AfterRenderContext) => string | void} AfterRenderHook
 */

/**
 * 文档 AST 解析完成后钩子（注册为 DocumentFinalizer）。
 *
 * @typedef {(root: MarkdownNode, ctx: BlockParseContext) => MarkdownNode | void} AfterParseHook
 */

/**
 * 单个扩展的 parser 与钩子定义。
 *
 * @typedef {{
 *   inlineParsers?: BaseInlineParser[],
 *   blockParsers?: BaseBlockParser[],
 *   afterParse?: AfterParseHook,
 *   afterRender?: AfterRenderHook
 * }} ExtensionDef
 */

/**
 * 按扩展名索引的全部 Cherry 扩展定义。
 *
 * 每个键对应一种可选语法扩展；启用时将其 parser 合并进 TransformerEngine，
 * 并按需挂载 afterParse（文档级）或 afterRender（节点级）钩子。
 *
 * @type {Record<string, ExtensionDef>}
 */
const EXTENSION_DEFS = {
  /** 行内高亮语法 `==text==`。 */
  highlight: {
    inlineParsers: [highlightInline],
    blockParsers: [],
  },
  /** 行内 emoji 短码 `:name:`。 */
  emoji: {
    inlineParsers: [emojiInline],
    blockParsers: [],
  },
  /** 块级提示框 `!!! type`。 */
  alert: {
    inlineParsers: [],
    blockParsers: [alertBlock],
  },
  /**
   * 行内 HTML 属性片段 `{class="x"}`。
   * 解析后折叠到前一兄弟节点的 props.htmlAttrs，渲染后注入开标签。
   */
  html_attrs: {
    inlineParsers: [htmlAttrsInline],
    blockParsers: [],
    afterParse: foldHtmlAttrsInTree,
    afterRender({ node, html }) {
      const attrs = node.htmlAttrs;
      return attrs ? injectAttrsIntoFirstOpenTag(html, attrs) : html;
    },
  },
  /** 扩展任务列表（含扩展状态标记与图标）。 */
  tasklist: {
    inlineParsers: [],
    blockParsers: [taskListParser],
  },
  /** 数学公式与特殊代码块（mermaid / echarts / card 等）。 */
  cherry_syntax: {
    inlineParsers: [mathInline],
    blockParsers: [mathBlockParser, specialCodeParser],
  },
  /**
   * YAML Frontmatter 与 `[[var.path]]` 行内变量。
   * 解析完成后将 frontMatter 挂到 root。
   */
  frontmatter: {
    inlineParsers: [frontmatterVarInline],
    blockParsers: [frontmatterBlock],
    afterParse: attachFrontmatterToRoot,
  },
  /** 行内 HTML 注释语法。 */
  inline_comment: {
    inlineParsers: [inlineComment],
    blockParsers: [],
  },
  /**
   * 行内徽章 `[文本]{.variant .top}`。
   * 花括号属性需同时启用 `html_attrs`。
   */
  badge: {
    inlineParsers: [badgeInline],
    blockParsers: [],
  },
  /** 上标 / 下标行内语法。 */
  supsub: {
    inlineParsers: [subInlineParser, supInlineParser],
    blockParsers: [],
  },
  /** 块级容器语法。 */
  container: {
    inlineParsers: [],
    blockParsers: [containerBlock],
  },
  /** 块级卡片、卡片网格与瀑布流。 */
  card: {
    inlineParsers: [],
    blockParsers: cardBlockParsers,
  },
  /** 块级字段与字段组。 */
  field: {
    inlineParsers: [],
    blockParsers: fieldBlockParsers,
  },
  /** 块级标签页语法。 */
  tabs: {
    inlineParsers: [],
    blockParsers: [tabsBlock],
  },
  /** 块级步骤条语法。 */
  steps: {
    inlineParsers: [],
    blockParsers: [stepsBlock],
  },
  /** 块级时间线语法。 */
  timeline: {
    inlineParsers: [],
    blockParsers: [timelineBlock],
  },
  /** 块级折叠面板语法。 */
  collapse: {
    inlineParsers: [],
    blockParsers: [collapseBlock],
  },
  /** 块级 iframe 嵌入语法。 */
  iframe: {
    inlineParsers: [],
    blockParsers: [iframeBlock],
  },
  /** 块级 / 行内媒体语法。 */
  media: {
    inlineParsers: [mediaInline],
    blockParsers: [mediaBlock],
  },
  /** 行内 spoiler 遮罩语法。 */
  spoiler: {
    inlineParsers: [spoilerInline],
    blockParsers: [],
  },
  /**
   * 脚注引用、定义与文末脚注区。
   * 解析完成后整理脚注编号与反向链接。
   */
  footnote: {
    inlineParsers: [footnoteRefInline],
    blockParsers: [footnoteDefBlock, footnotesSection],
    afterParse: finalizeFootnotes,
  },
};

/**
 * 返回所有已注册的扩展名称列表。
 *
 * @returns {string[]}
 */
export function getAvailableExtensions() {
  return Object.keys(EXTENSION_DEFS);
}

/**
 * 将多种输入形式规范为扩展名称数组。
 *
 * @param {string[] | { names: string[] } | null | undefined} names
 * @returns {string[]}
 */
function normalizeExtensionNames(names) {
  if (Array.isArray(names)) return names;
  if (names && Array.isArray(names.names)) return names.names;
  return [];
}

/**
 * 根据扩展名称收集对应的行内 / 块级 parser 实例。
 *
 * @param {string[] | { names: string[] }} [names=[]]
 * @returns {{ inlineParsers: BaseInlineParser[], blockParsers: BaseBlockParser[] }}
 */
export function createExtensionParsers(names = []) {
  const inlineParsers = [];
  const blockParsers = [];

  for (const name of new Set(normalizeExtensionNames(names))) {
    const ext = EXTENSION_DEFS[name];
    if (!ext) continue;
    inlineParsers.push(...(ext.inlineParsers ?? []));
    blockParsers.push(...(ext.blockParsers ?? []));
  }

  return { inlineParsers, blockParsers };
}

/**
 * 将用户 afterRender 与扩展 afterRender 串联为单一钩子。
 * 扩展钩子先执行，用户钩子后执行。
 *
 * @param {AfterRenderHook | null | undefined} userHook
 * @param {AfterRenderHook | null | undefined} extHook
 * @returns {AfterRenderHook | null | undefined}
 */
function chainAfterRender(userHook, extHook) {
  if (!extHook) return userHook;
  if (!userHook) return extHook;
  return (ctx) => {
    const withExt = extHook(ctx) ?? ctx.html;
    return userHook({ ...ctx, html: withExt }) ?? withExt;
  };
}

/**
 * 收集指定扩展的 afterParse 钩子，供注册为 DocumentFinalizer。
 *
 * @param {string[] | { names: string[] }} names
 * @returns {AfterParseHook[]}
 */
function composeDocumentFinalizers(names) {
  const fns = [];
  for (const name of new Set(normalizeExtensionNames(names))) {
    const fn = EXTENSION_DEFS[name]?.afterParse;
    if (fn) fns.push(fn);
  }
  return fns;
}

/**
 * 合并指定扩展的 afterRender 钩子，按启用顺序依次执行。
 *
 * @param {string[] | { names: string[] }} names
 * @returns {AfterRenderHook | null}
 */
function composeAfterRender(names) {
  const hooks = [];
  for (const name of new Set(normalizeExtensionNames(names))) {
    const hook = EXTENSION_DEFS[name]?.afterRender;
    if (hook) hooks.push(hook);
  }
  if (hooks.length === 0) return null;
  return (ctx) => {
    let html = ctx.html;
    for (const hook of hooks) {
      html = hook({ ...ctx, html }) ?? html;
    }
    return html;
  };
}

/**
 * 生成可传入 TransformerEngine 构造函数的 options（含 parser 与 hooks）。
 *
 * 在 baseOptions 基础上追加扩展 parser，并合并 afterRender 与 documentFinalizers。
 *
 * @param {string[] | { names: string[] }} [names=[]]
 * @param {Object} [baseOptions={}]
 * @param {BaseInlineParser[]} [baseOptions.inlineParsers]
 * @param {BaseBlockParser[]} [baseOptions.blockParsers]
 * @param {AfterRenderHook} [baseOptions.afterRender]
 * @returns {Object}
 */
export function createExtensionOptions(names = [], baseOptions = {}) {
  const { inlineParsers, blockParsers } = createExtensionParsers(names);

  return {
    ...baseOptions,
    inlineParsers: [...(baseOptions.inlineParsers ?? []), ...inlineParsers],
    blockParsers: [...(baseOptions.blockParsers ?? []), ...blockParsers],
    afterRender: chainAfterRender(
      baseOptions.afterRender,
      composeAfterRender(names),
    ),
    documentFinalizers: composeDocumentFinalizers(names),
  };
}

/**
 * 创建已注入扩展的 Transformer，扩展逻辑不污染 TransformerEngine 核心。
 *
 * DocumentFinalizer 仅在 parse() 出口执行；直接 render(root) 的 AST 须来自 parse()。
 *
 * @param {string[] | { names: string[] }} [names=[]]
 * @param {Object} [options={}] - 传给 createExtensionOptions 的 baseOptions
 * @returns {import('@/transformer/TransformerEngine.js').TransformerEngine}
 */
export function createTransformerWithExtensions(names = [], options = {}) {
  return createTransformer(createExtensionOptions(names, options));
}

export default {
  getAvailableExtensions,
  createExtensionParsers,
  createExtensionOptions,
  createTransformerWithExtensions,
};
