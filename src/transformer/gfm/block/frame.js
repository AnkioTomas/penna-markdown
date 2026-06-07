/**
 * 块级解析栈帧辅助（blockquote 等嵌套块级上下文）
 */

/**
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

/** @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx */
export function isInBlockquote(ctx) {
  return ctx.store.isInBlockquote();
}
