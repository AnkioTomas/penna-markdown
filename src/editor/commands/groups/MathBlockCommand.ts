/**
 * 块级 LaTeX 公式命令。
 */
import { SnippetCommand } from "@/editor/commands/groups/SnippetCommand";

/**
 * `mathBlock` — 块级 LaTeX 公式。
 * 语法：`$$\n...\n$$`，插入后选中公式内容
 */
export const mathBlockCommand = new SnippetCommand("$$\nE = mc^2\n$$\n", 3, 10);
