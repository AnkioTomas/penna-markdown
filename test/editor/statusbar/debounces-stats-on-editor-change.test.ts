/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createTestEventBus } from "../../_helpers/eventBus";
import { StatusBar } from "@/editor/statusbar/StatusBar";

it("debounces word and character stats updates on editor:change", () => {
  vi.useFakeTimers();
  const mount = document.createElement("div");
  const eventBus = createTestEventBus();
  const statusBar = new StatusBar(mount, eventBus);
  const countEl = mount.querySelector(".cherry-statusbar-count")!;

  eventBus.emit("editor:change", { markdown: "a" });
  eventBus.emit("editor:change", { markdown: "ab" });
  eventBus.emit("editor:change", { markdown: "abc" });
  expect(countEl.textContent).toBe("");

  vi.advanceTimersByTime(200);
  expect(countEl.textContent).toBe("1 词 · 3 字符");

  statusBar.destroy();
  vi.useRealTimers();
});
