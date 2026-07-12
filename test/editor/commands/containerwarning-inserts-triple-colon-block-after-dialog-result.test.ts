/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { runCommand } from "@/editor/commands/index.js";
import { createCommandContext, createCommandView } from "./helpers";

it("containerWarning inserts triple-colon block after dialog result", async () => {
  const view = createCommandView("");
  const { eventBus, ctx } = createCommandContext();
  eventBus.on("editor:dialog:open", (payload) => {
    const { id } = payload as { id: string };
    queueMicrotask(() => {
      eventBus.emit("editor:dialog:result", {
        id,
        data: { type: "warning", title: "警告", content: "容器内容" },
      });
    });
  });
  await runCommand(view, "containerWarning", undefined, ctx);
  expect(view.state.doc.toString()).toBe("::: warning 警告\n容器内容\n:::\n");
  view.destroy();
});
