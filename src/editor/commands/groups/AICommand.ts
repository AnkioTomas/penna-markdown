import type { EditorView } from "@codemirror/view";
import { Command, type CommandContext } from "@/editor/commands/Command";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { AI_MENU_IDS } from "@/editor/toolbar/defaults";
import { runAIAction } from "@/editor/ai/runAction";

/** 创建单个 AI 工具栏命令，命令名与工具栏 id 一致（如 `ai-polish`）。 */
export function createAICommand(action: string): Command {
  return {
    execute(
      view: EditorView,
      _payload: unknown,
      ctx: CommandContext,
    ): boolean | Promise<boolean> {
      const onAiRequest = ctx.onAiRequest;
      const onAiRequestCancel = ctx.onAiRequestCancel;
      const theme = ctx.theme;
      const eventBus = ctx.eventBus;
      const logger = ctx.logger;
      if (!onAiRequest || !theme || !logger) return false;

      if (action === "custom") {
        if (!eventBus) return false;
        return (async () => {
          const result = await requestDialog(eventBus, "aiCustom");
          if (!result?.prompts) return false;
          runAIAction(
            view,
            action,
            onAiRequest,
            theme,
            logger,
            onAiRequestCancel,
            result.prompts,
          );
          return true;
        })();
      }

      runAIAction(view, action, onAiRequest, theme, logger, onAiRequestCancel);
      return true;
    },
  };
}

/** 注册表用：`ai-polish`、`ai-proofread` 等。 */
export const AI_COMMANDS = Object.fromEntries(
  AI_MENU_IDS.map((id) => [id, createAICommand(id.slice(3))]),
) as Record<string, Command>;
