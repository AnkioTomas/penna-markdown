import { BlockContext, Line, MarkdownConfig } from "@lezer/markdown";
import { pennaTags } from "./tags";

export const PennaMathBlockExtension: MarkdownConfig = {
  defineNodes: [
    { name: "PennaMathBlock", style: pennaTags.mathBlock },
    { name: "PennaMathBlockMark", style: pennaTags.mathBlock },
  ],
  parseBlock: [
    {
      name: "PennaMathBlock",
      parse(cx: BlockContext, line: Line) {
        const match = /^(\s*)\$\$/.exec(line.text);
        if (match) {
          const start = cx.lineStart + match[1].length;
          const marks = [cx.elt("PennaMathBlockMark", start, start + 2)];

          // 消费起始行并进入下一行
          let hasNext = cx.nextLine();

          while (hasNext) {
            const endMatch = /^\s*\$\$/.exec(line.text);
            if (endMatch) {
              const endMarkStart = cx.lineStart + endMatch[0].indexOf("$$");
              marks.push(
                cx.elt("PennaMathBlockMark", endMarkStart, endMarkStart + 2),
              );
              cx.nextLine(); // 消费结束行
              break;
            }
            hasNext = cx.nextLine();
          }

          cx.addElement(cx.elt("PennaMathBlock", start, cx.lineStart, marks));
          return true;
        }
        return false;
      },
      before: "FencedCode", // 优先级高于代码块
    },
  ],
};
