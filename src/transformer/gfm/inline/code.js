/**
 * 行内语法：行内代码 (Code Span)
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

class InlineCodeParser extends BaseInlineParser {
  constructor() {
    super({ type: "code_span", priority: 100 });
  }

  parse(src, index) {
    const rest = src.slice(index);
    const match = rest.match(/^(`+)/);
    if (!match) return null;

    const fence = match[1];
    const fenceLength = fence.length;
    let i = index + fenceLength;
    
    // 寻找匹配的结束符
    while (i < src.length) {
      if (src[i] === '`') {
        const endMatch = src.slice(i).match(/^(`+)/);
        if (endMatch[1].length === fenceLength) {
          // 匹配成功
          let content = src.slice(index + fenceLength, i);
          
          // 处理换行：行内代码中的换行应转换为空格
          content = content.replace(/\n/g, ' ');

          // 处理前导/后置空格（如果内容不全为空格且两端都有空格，则去掉一对）
          if (content.startsWith(' ') && content.endsWith(' ') && content.trim() !== '') {
            content = content.slice(1, -1);
          }

          const node = createNode(this.type, { content });
          return { node, nextIndex: i + fenceLength };
        }
        // 如果长度不等，跳过这些反引号
        i += endMatch[1].length;
      } else {
        i++;
      }
    }

    // 未找到闭合反引号，不匹配
    return null;
  }

  render(node) {
    return `<code>${escapeHtml(node.props.content)}</code>`;
  }
}

export default new InlineCodeParser();
