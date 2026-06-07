/**
 * @file 块级解析栈帧辅助
 * @module transformer/gfm/block/frame
 *
 * blockquote 等嵌套块级上下文的栈帧管理。
 */

/**
 * 在 blockquote 栈帧内执行块级解析。
 *
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @param {() => T} fn
 * @returns {T}
 * @template T
 */
export function withBlockquoteFrame(ctx, fn) {
  ctx.store.beginBlockFrame({ inBlockquote: true });
  try {
    return fn();
  } finally {
    ctx.store.endBlockFrame();
  }
}

/**
 * 当前块级解析是否处于 blockquote 栈帧内。
 *
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {boolean}
 */
export function isInBlockquote(ctx) {
  return ctx.store.isInBlockquote();
}
