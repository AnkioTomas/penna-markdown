/**
 * iph.href.lu 占位图
 * @see http://iph.href.lu/
 *
 * @param {number} width
 * @param {number} height
 * @param {string} text
 * @param {{ fg?: string, bg?: string }} [style]
 * @returns {string}
 */
export function img(width, height, text, style = {}) {
  const w = Math.min(2048, Math.max(1, Math.round(width)));
  const h = Math.min(2048, Math.max(1, Math.round(height)));
  const params = new URLSearchParams({ text });
  if (style.fg) params.set("fg", style.fg.replace(/^#/, ""));
  if (style.bg) params.set("bg", style.bg.replace(/^#/, ""));
  return `http://iph.href.lu/${w}x${h}?${params}`;
}
