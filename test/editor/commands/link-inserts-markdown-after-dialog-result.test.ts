/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { runCommand } from "@/editor/commands/index.js";
import { createCommandContext, createCommandView } from "./helpers";

it("link inserts markdown after dialog result", async () => {
  const view = createCommandView("");
  const { eventBus, ctx } = createCommandContext();
  eventBus.on("editor:dialog:open", (payload) => {
    const { id } = payload as { id: string };
    queueMicrotask(() => {
      eventBus.emit("editor:dialog:result", {
        id,
        data: { text: "Cherry", url: "https://example.com" },
      });
    });
  });
  await runCommand(view, "link", undefined, ctx);
  expect(view.state.doc.toString()).toBe("[Cherry](https://example.com)");
  view.destroy();
});
