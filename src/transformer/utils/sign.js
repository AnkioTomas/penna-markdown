/**
 * 内容签名：为块级节点生成稳定哈希，供增量预览 data-sign 使用（非加密用途）。
 */

/** 对字符串做 djb2 变体哈希，返回 36 进制短串 */
export function contentSign(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 33) ^ text.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}
