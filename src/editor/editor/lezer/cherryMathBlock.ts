import { BlockContext, Line, MarkdownConfig } from "@lezer/markdown";
import { cherryTags } from "./tags";

export const CherryMathBlockExtension: MarkdownConfig = {
  defineNodes: [
    { name: "CherryMathBlock", style: cherryTags.mathBlock },
    { name: "CherryMathBlockMark", style: cherryTags.mathBlock },
  ],
  parseBlock: [
    {
      name: "CherryMathBlock",
      parse(cx: BlockContext, line: Line) {
        const match = /^(\s*)\$\$/.exec(line.text);
        if (match) {
          const start = cx.lineStart + match[1].length;
          const marks = [cx.elt("CherryMathBlockMark", start, start + 2)];

          // 消费起始行并进入下一行
          let hasNext = cx.nextLine();

          while (hasNext) {
            const endMatch = /^\s*\$\$/.exec(line.text);
            if (endMatch) {
              const endMarkStart = cx.lineStart + endMatch[0].indexOf("$$");
              marks.push(
                cx.elt("CherryMathBlockMark", endMarkStart, endMarkStart + 2),
              );
              cx.nextLine(); // 消费结束行
              break;
            }
            hasNext = cx.nextLine();
          }

          cx.addElement(cx.elt("CherryMathBlock", start, cx.lineStart, marks));
          return true;
        }
        return false;
      },
      before: "FencedCode", // 优先级高于代码块
    },
  ],
};
