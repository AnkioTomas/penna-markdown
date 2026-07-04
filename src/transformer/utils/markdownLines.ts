/** 与 TransformerEngine 一致的 markdown 行规范化。 */
export function normalizeMarkdownLines(markdown: string): string[] {
  let text = String(markdown).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!text.endsWith("\n")) text += "\n";
  const lines = text.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

export function lineIndexAtPos(doc: string, pos: number): number {
  const clamped = Math.max(0, Math.min(pos, doc.length));
  let line = 0;
  for (let i = 0; i < clamped; i++) {
    if (doc[i] === "\n") line += 1;
  }
  return line;
}
