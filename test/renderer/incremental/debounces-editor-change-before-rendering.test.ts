/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createTestTheme } from "../../_helpers/busTheme";
import { Preview } from "@/editor/preview/Preview";

it("debounces editor:change before rendering", () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="preview"></div>';
  const mount = document.getElementById("preview") as HTMLElement;
  const { theme, eventBus, log } = createTestTheme();
  const preview = new Preview(mount, theme, eventBus, log);

  const renderSpy = vi.fn();
  eventBus.on("preview:rendered", renderSpy);
  eventBus.emit("editor:change", { markdown: "a" });
  renderSpy.mockClear();

  eventBus.emit("editor:change", { markdown: "ab" });
  eventBus.emit("editor:change", { markdown: "abc" });
  expect(renderSpy).not.toHaveBeenCalled();

  vi.advanceTimersByTime(50);
  expect(renderSpy).toHaveBeenCalledTimes(1);

  preview.destroy();
  vi.useRealTimers();
  document.body.innerHTML = "";
});
