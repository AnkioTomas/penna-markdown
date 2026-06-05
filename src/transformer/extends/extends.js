import { createTransformer } from "@/transformer/index.js";
import htmlAttrsInline from "@/transformer/extends/inline/html_attrs.js";
import { foldHtmlAttrsInTree } from "@/transformer/extends/postprocess/foldHtmlAttrs.js";
import { injectAttrsIntoFirstOpenTag } from "@/transformer/extends/utils/injectAttrs.js";

const EXTENSION_DEFS = {
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

function composeAfterParse(names) {
  const fns = [];
  for (const name of new Set(normalizeExtensionNames(names))) {
    const fn = EXTENSION_DEFS[name]?.afterParse;
    if (fn) fns.push(fn);
  }
  if (fns.length === 0) return null;
  return (ast) => {
    for (const fn of fns) fn(ast);
  };
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
    _extensionAfterParse: composeAfterParse(names),
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
  const afterParse = extOptions._extensionAfterParse;
  delete extOptions._extensionAfterParse;

  const engine = createTransformer(extOptions);

  if (afterParse) {
    const origParse = engine.parse.bind(engine);
    engine.parse = (markdown) => {
      const result = origParse(markdown);
      afterParse(result.ast);
      return result;
    };

    const origRender = engine.render.bind(engine);
    engine.render = (input) => {
      if (typeof input === "object" && input?.type === "root") {
        afterParse(input);
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
