import type { EditorView } from "@codemirror/view";
import type { Theme } from "@/theme/Theme";
import { runCommand, type EditorCommand } from "@/editor/commands";
import { ParserStore } from "@/transformer/core/ParserStore";

export class CommandBridge {
  private readonly offs: (() => void)[] = [];

  constructor(
    private readonly theme: Theme,
    private readonly getView: () => EditorView,
    private readonly getStore?: () => ParserStore,
  ) {
    this.offs.push(
      theme.on("editor:command", (payload) => {
        const { command, payload: data } = payload as {
          command: EditorCommand;
          payload?: unknown;
        };
        void runCommand(this.getView(), command, data, {
          theme: this.theme,
          getStore: this.getStore,
        });
      }),
    );
  }

  execute(command: EditorCommand, payload?: unknown): Promise<boolean> {
    const result = runCommand(this.getView(), command, payload, {
      theme: this.theme,
      getStore: this.getStore,
    });
    return Promise.resolve(result);
  }

  destroy(): void {
    for (const off of this.offs) off();
    this.offs.length = 0;
  }
}
