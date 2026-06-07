import { createTransformer } from "@/transformer/index.js";
import htmlAttrsInline from "@/transformer/extends/inline/html_attrs.js";
import highlightInline from "@/transformer/extends/inline/highlight.js";
import emojiInline from "@/transformer/extends/inline/emoji.js";
import alertBlock from "@/transformer/extends/block/alert.js";
import { applyTagFilter } from "@/transformer/gfm/utils/tagfilter.js";
import { foldHtmlAttrsInTree } from "@/transformer/extends/postprocess/foldHtmlAttrs.js";
import taskListParser from "@/transformer/extends/block/taskList.js";
import mathBlockParser from "@/transformer/extends/block/mathBlock.js";
import specialCodeParser from "@/transformer/extends/block/specialCode.js";
import frontmatterBlock, {
  attachFrontmatterToRoot,
} from "@/transformer/extends/block/frontmatter.js";
import frontmatterVarInline from "@/transformer/extends/inline/frontmatterVar.js";
import inlineComment from "@/transformer/extends/inline/comment.js";
import { injectAttrsIntoFirstOpenTag } from "@/transformer/extends/utils/injectAttrs.js";

const EXTENSION_DEFS = {
  highlight: {
    inlineParsers: [highlightInline],
    blockParsers: [],
  },
  emoji: {
    inlineParsers: [emojiInline],
    blockParsers: [],
  },
  alert: {
    inlineParsers: [],
    blockParsers: [alertBlock],
  },
  html_attrs: {
    inlineParsers: [htmlAttrsInline],
    blockParsers: [],
    /** 解析后折叠 AST */
    afterParse: foldHtmlAttrsInTree,
    /** 渲染后把 props.htmlAttrs 注入开标签 */
    afterRender({ node, html }) {
      const attrs = node.props?.htmlAttrs;
      return attrs ? injectAttrsIntoFirstOpenTag(html, attrs) : html;
    },
  },
  tagfilter: {
    inlineParsers: [],
    blockParsers: [],
    afterRender({ html }) {
      return applyTagFilter(html);
    },
  },
  extended_tasklist: {
    inlineParsers: [],
    blockParsers: [taskListParser],
  },
  cherry_syntax: {
    inlineParsers: [],
    blockParsers: [mathBlockParser, specialCodeParser],
  },
  frontmatter: {
    inlineParsers: [frontmatterVarInline],
    blockParsers: [frontmatterBlock],
    afterParse: attachFrontmatterToRoot,
  },
  inline_comment: {
    inlineParsers: [inlineComment],
    blockParsers: [],
  },
};

export function getAvailableExtensions() {
  return Object.keys(EXTENSION_DEFS);
}

function normalizeExtensionNames(names) {
  if (Array.isArray(names)) return names;
  if (names && Array.isArray(names.names)) return names.names;
  return [];
}

/**
 * @param {string[] | { names: string[] }} names
 * @returns {{ inlineParsers: object[], blockParsers: object[] }}
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

function chainAfterRender(userHook, extHook) {
  if (!extHook) return userHook;
  if (!userHook) return extHook;
  return (ctx) => {
    const withExt = extHook(ctx) ?? ctx.html;
    return userHook({ ...ctx, html: withExt }) ?? withExt;
  };
}

function composeDocumentFinalizers(names) {
  const fns = [];
  for (const name of new Set(normalizeExtensionNames(names))) {
    const fn = EXTENSION_DEFS[name]?.afterParse;
    if (fn) fns.push(fn);
  }
  return fns;
}

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
 * @param {string[]} names
 * @param {object} [baseOptions]
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
 * @param {string[]} names
 * @param {object} [options]
 */
export function createTransformerWithExtensions(names = [], options = {}) {
  const extOptions = createExtensionOptions(names, options);
  const documentFinalizers = extOptions.documentFinalizers ?? [];
  delete extOptions.documentFinalizers;

  const engine = createTransformer(extOptions);

  for (const fn of documentFinalizers) {
    engine.registry.registerDocumentFinalizer(fn);
  }

  if (documentFinalizers.length > 0) {
    const origRender = engine.render.bind(engine);
    engine.render = (input) => {
      if (typeof input === "object" && input?.type === "root") {
        engine.blockParser.finalizeDocument(input);
      }
      return origRender(input);
    };
  }

  return engine;
}

export default {
  getAvailableExtensions,
  createExtensionParsers,
  createExtensionOptions,
  createTransformerWithExtensions,
};
