/**
 * 切换编辑器主题命令。
 * 通过 {@link CommandContext.theme} 调用 Theme API，需 payload `{ id: string }`。
 */
import type { EditorView } from "@codemirror/view";
import { Command, type CommandContext } from "@/editor/commands/Command";

class SetThemeCommand implements Command {
  /**
   * @param _view
   * @param payload - `{ id: "default" | "github" | ... }`，须为已注册主题 id
   * @param ctx
   * @returns 无 theme 或 id 非法时返回 false
   */
  execute(_view: EditorView, payload: unknown, ctx: CommandContext): boolean {
    const id = String((payload as { id?: string })?.id ?? "");
    const theme = ctx.theme;
    if (!theme) return false;
    if (!theme.list().includes(id)) return false;
    theme.setTheme(id);
    return true;
  }
}

/**
 * `setTheme` — 切换编辑器/预览主题。
 * payload: `{ id: "default" | "github" | ... }`
 */
export const setThemeCommand = new SetThemeCommand();
