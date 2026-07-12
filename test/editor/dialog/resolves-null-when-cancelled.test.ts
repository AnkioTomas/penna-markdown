/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { requestDialog } from "@/editor/dialog/requestDialog.js";

it("resolves null when cancelled", async () => {
  const eventBus = new EventBus(false, "[test]", new Log(false));
  let id = "";
  eventBus.on("editor:dialog:open", (payload) => {
    id = (payload as { id: string }).id;
  });
  const p = requestDialog(eventBus, "table");
  await Promise.resolve();
  eventBus.emit("editor:dialog:result", { id, cancelled: true });
  expect(await p).toBeNull();
});
