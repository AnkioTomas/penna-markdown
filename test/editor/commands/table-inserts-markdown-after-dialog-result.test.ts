/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { runCommand } from "@/editor/commands/index.js";
import { createCommandContext, createCommandView } from "./helpers";

it("table inserts markdown after dialog result", async () => {
  const view = createCommandView("");
  const { eventBus, ctx } = createCommandContext();
  eventBus.on("editor:dialog:open", (payload) => {
    const { id } = payload as { id: string };
    queueMicrotask(() => {
      eventBus.emit("editor:dialog:result", { id, data: { rows: 2, cols: 2 } });
    });
  });
  await runCommand(view, "table", undefined, ctx);
  expect(view.state.doc.toString()).toContain("| --- | --- |");
  view.destroy();
});
