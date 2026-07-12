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
    return applyTheme(ctx, id);
  }
}

function applyTheme(ctx: CommandContext, id: string): boolean {
  const theme = ctx.theme;
  if (!theme) return false;
  if (!theme.list().includes(id)) return false;
  theme.setTheme(id);
  return true;
}

/** 创建绑定固定主题 id 的命令，命令名与工具栏 id 一致（如 `theme-github`）。 */
export function createThemeCommand(themeId: string): Command {
  return {
    execute(_view, _payload, ctx) {
      return applyTheme(ctx, themeId);
    },
  };
}

/**
 * `setTheme` — 切换编辑器/预览主题。
 * payload: `{ id: "default" | "github" | ... }`
 */
export const setThemeCommand = new SetThemeCommand();
