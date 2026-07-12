/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { runCommand } from "@/editor/commands/index.js";
import { createCommandContext, createCommandView } from "./helpers";

it("badge opens dialog when selection is empty", async () => {
  const view = createCommandView("");
  const { eventBus, ctx } = createCommandContext();
  eventBus.on("editor:dialog:open", (payload) => {
    const { id } = payload as { id: string };
    queueMicrotask(() => {
      eventBus.emit("editor:dialog:result", {
        id,
        data: { text: "new", variant: "warning" },
      });
    });
  });
  await runCommand(view, "badge", undefined, ctx);
  expect(view.state.doc.toString()).toBe("[new]{.warning}");
  view.destroy();
});
