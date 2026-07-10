/**
 * @file 剪贴板写入
 * @module renderer/code/copy
 *
 * 优先使用 Clipboard API；不可用时降级 `document.execCommand('copy')`。
 * 供 {@link CodeListener} 复制按钮回调使用。
 */

/**
 * 将文本写入系统剪贴板。
 *
 * @param text 待复制内容
 * @param doc  按钮所在文档，用于获取 `navigator` 与临时 textarea
 */
export async function copyText(text: string, doc: Document): Promise<void> {
  const nav = doc.defaultView?.navigator;
  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(text);
    return;
  }

  const textarea = doc.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  doc.body.appendChild(textarea);
  textarea.select();
  doc.execCommand("copy");
  doc.body.removeChild(textarea);
}
