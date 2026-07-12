/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { requestDialog } from "@/editor/dialog/requestDialog.js";

it("resolves with dialog data", async () => {
  const eventBus = new EventBus(false, "[test]", new Log(false));
  let id = "";
  eventBus.on("editor:dialog:open", (payload) => {
    id = (payload as { id: string }).id;
  });
  const p = requestDialog(eventBus, "link", { text: "a", url: "b" });
  await Promise.resolve();
  eventBus.emit("editor:dialog:result", {
    id,
    data: { text: "T", url: "https://x.test" },
  });
  const result = await p;
  expect(result).toEqual({ text: "T", url: "https://x.test" });
});
