import { BlockContext, Line, MarkdownConfig } from "@lezer/markdown";
import { cherryTags } from "./tags.js";

export const CherryCommentBlockExtension: MarkdownConfig = {
  defineNodes: [
    { name: "CherryCommentBlock", style: cherryTags.commentBlock, block: true },
    { name: "CherryCommentBlockMark", style: cherryTags.commentBlock }
  ],
  parseBlock: [{
    name: "CherryCommentBlock",
    parse(cx: BlockContext, line: Line) {
      const match = /^( {0,3})%%%(?!%)/.exec(line.text);
      if (match) {
        const start = cx.lineStart + match[1].length;
        const marks = [cx.elt("CherryCommentBlockMark", start, start + 3)];
        
        // 消费起始行并进入下一行
        let hasNext = cx.nextLine();
        
        while (hasNext) {
          const endMatch = /^\s*%%%/.exec(line.text);
          if (endMatch) {
            const endMarkStart = cx.lineStart + line.text.indexOf("%%%");
            marks.push(cx.elt("CherryCommentBlockMark", endMarkStart, endMarkStart + 3));
            cx.nextLine(); // 消费结束行
            break;
          }
          hasNext = cx.nextLine();
        }
        
        cx.addElement(cx.elt("CherryCommentBlock", start, cx.lineStart, marks));
        return true;
      }
      return false;
    },
    endLeaf(_cx, line) {
      return /^( {0,3})%%%(?!%)/.test(line.text);
    },
    before: "FencedCode" // 优先级高于代码块
  }]
};
