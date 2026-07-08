/**
 * 切换编辑器主题命令。
 * 通过 {@link CommandContext.theme} 调用 Theme API，需 payload `{ id: string }`。
 */
import type { EditorView } from "@codemirror/view";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";
import { Command, type CommandContext } from "@/editor/commands/Command";

class SetThemeCommand implements Command {
  /**
   * @param _view
   * @param payload - `{ id: "light" | "dark" | ... }`，须为已注册主题 id
   * @param ctx
   * @returns 无 theme 或 id 非法时返回 false
   */
  execute(_view: EditorView, payload: unknown, ctx: CommandContext): boolean {
    const id = String((payload as { id?: string })?.id ?? "");
    const theme = ctx.theme;
    if (!theme) return false;
    const { render, root } = theme.getTheme();
    if (
      !render ||
      !REGISTERED_THEMES.includes(id as (typeof REGISTERED_THEMES)[number])
    ) {
      return false;
    }
    theme.setTheme(id, render, root ?? undefined);
    return true;
  }
}

/**
 * `setTheme` — 切换编辑器/预览主题。
 * payload: `{ id: "light" | "dark" | ... }`
 */
export const setThemeCommand = new SetThemeCommand();
