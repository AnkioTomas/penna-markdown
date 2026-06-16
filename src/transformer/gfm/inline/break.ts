/**
 * @file 行内语法：换行 (Softbreak / Hardbreak)
 * @module transformer/gfm/inline/break
 *
 * 软换行（单 `\n`）、硬换行（行末两空格或 `\` + 换行）。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";

/**
 * 换行行内解析器。
 * * 纯游标扫描，零正则，零内存分配 (0 Allocation)。
 * @extends {BaseInlineParser}
 */
class BreakParser extends BaseInlineParser {
  constructor() {
    // 优先级高于 text，确保 `\` + 换行 优先于普通反斜杠转义
    super("break", false);
  }

  /** @inheritdoc */
  parse(src: string, index: number, _ctx: any) {
    let i = index;
    let isHard = false;
    let breakFound = false;

    // 1. 处理反斜杠 + 换行符 (Hardbreak)
    if (src[i] === '\\' && src[i + 1] === '\n') {
      isHard = true;
      breakFound = true;
      i += 2; // 跳过 \ 和 \n
    }
    // 2. 处理空格/制表符 + 换行符，或者直接就是换行符 (Softbreak/Hardbreak)
    else if (src[i] === ' ' || src[i] === '\t' || src[i] === '\n') {
      let spaceCount = 0;
      let hasTab = false;

      // 统计 \n 前面的空格和制表符
      while (i < src.length && (src[i] === ' ' || src[i] === '\t')) {
        if (src[i] === '\t') {
          hasTab = true;
        } else {
          spaceCount++;
        }
        i++;
      }

      // 如果后面跟着换行符，说明匹配成功！
      if (i < src.length && src[i] === '\n') {
        breakFound = true;
        // CommonMark 规范：只有两个或以上纯空格（不能包含 tab）才算 hardbreak
        isHard = spaceCount >= 2 && !hasTab;
        i++; // 跳过 \n
      } else {
        // 如果后面不是换行符（比如只是一堆普通空格），放弃解析，把控制权还给外层的 Text 解析器
        return null;
      }
    } else {
      return null;
    }

    // 3. 通用收尾：只要找到了换行，按规范必须吃掉换行符后面的前导空白
    if (breakFound) {
      while (i < src.length && (src[i] === ' ' || src[i] === '\t')) {
        i++;
      }

      // 计算总共吃掉的字符长度（包括前面的 \、空格、\n 以及后面的空格）
      const length = i - index;

      const node = createNode("break", length, undefined, [], {
        isHard
      });

      return { node, nextIndex: i };
    }

    return null;
  }

  /** @inheritdoc */
  render(node: MarkdownNode, _ctx: any) {
    // 统一从 props 里拿取属性
    if (node.props?.isHard) return "<br />\n";
    return "\n";
  }
}

export default new BreakParser();