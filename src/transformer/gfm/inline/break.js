/**
 * 行内语法：换行 (Softbreak / Hardbreak)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

class BreakParser extends BaseInlineParser {
  constructor() {
    // 优先级应高于 escape (100) 和 text，确保处理反斜杠换行
    super({ type: "break", priority: 110 });
  }

  parse(src, index, ctx) {
    // 1. 处理反斜杠 + 换行符 (Hardbreak)
    if (src[index] === "\\" && src[index + 1] === "\n") {
      let nextIndex = index + 2;
      // 规范规定：换行符后的前导空格应被忽略
      while (nextIndex < src.length && (src[nextIndex] === " " || src[nextIndex] === "\t")) {
        nextIndex++;
      }
      return {
        node: createNode(this.type, { isHard: true }),
        nextIndex
      };
    }

    // 2. 处理空格/制表符 + 换行符
    if (src[index] === " " || src[index] === "\t") {
      const rest = src.slice(index);
      const match = rest.match(/^([ \t]+)\n/);
      if (match) {
        const spaces = match[1];
        let nextIndex = index + match[0].length;
        // 规范规定：换行符后的前导空格应被忽略
        while (nextIndex < src.length && (src[nextIndex] === " " || src[nextIndex] === "\t")) {
          nextIndex++;
        }
        
        // 只有两个或以上空格才算 hardbreak，且不能包含制表符（根据 CommonMark 0.30）
        const isHard = spaces.length >= 2 && !spaces.includes("\t");
        return {
          node: createNode(this.type, { isHard }),
          nextIndex
        };
      }
      return null;
    }

    // 3. 处理孤立的换行符 (Softbreak)
    if (src[index] === "\n") {
      let nextIndex = index + 1;
      // 规范规定：换行符后的前导空格应被忽略
      while (nextIndex < src.length && (src[nextIndex] === " " || src[nextIndex] === "\t")) {
        nextIndex++;
      }
      return {
        node: createNode(this.type, { isHard: false }),
        nextIndex
      };
    }

    return null;
  }

  render(node, ctx) {
    if (node.props?.isHard) return "<br />\n";
    // Softbreak 渲染为换行符
    return "\n";
  }
}

export default new BreakParser();
