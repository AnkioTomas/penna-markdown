/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { runCommand } from "@/editor/commands/index.js";
import { createCommandContext, createCommandView } from "./helpers";

it("alertTip inserts GFM admonition after dialog result", async () => {
  const view = createCommandView("");
  const { eventBus, ctx } = createCommandContext();
  eventBus.on("editor:dialog:open", (payload) => {
    const { id } = payload as { id: string };
    queueMicrotask(() => {
      eventBus.emit("editor:dialog:result", {
        id,
        data: { kind: "TIP", content: "提示内容" },
      });
    });
  });
  await runCommand(view, "alertTip", undefined, ctx);
  expect(view.state.doc.toString()).toBe("> [!TIP]\n> 提示内容\n");
  view.destroy();
});
