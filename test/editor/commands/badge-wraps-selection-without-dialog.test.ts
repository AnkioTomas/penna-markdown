/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { runCommand } from "@/editor/commands/index.js";
import { createCommandContext, createCommandView } from "./helpers";

it("badge wraps selection without dialog", async () => {
  const view = createCommandView("note", { anchor: 0, head: 4 });
  const { eventBus, ctx } = createCommandContext();
  const openSpy = vi.fn();
  eventBus.on("editor:dialog:open", openSpy);
  await runCommand(view, "badge", { variant: "tip" }, ctx);
  expect(view.state.doc.toString()).toBe("[note]{.tip}");
  expect(openSpy).not.toHaveBeenCalled();
  view.destroy();
});
