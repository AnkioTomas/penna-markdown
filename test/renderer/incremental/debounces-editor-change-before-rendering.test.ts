/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { Theme } from "@/theme/Theme.js";
import { Preview } from "@/editor/preview/Preview";

it("debounces editor:change before rendering", () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="preview"></div>';
  const mount = document.getElementById("preview") as HTMLElement;
  const theme = new Theme();
  theme.setTheme("default", mount);

  const renderSpy = vi.fn();
  const preview = new Preview(mount, theme, { debounceMs: 100 });

  theme.on("preview:rendered", renderSpy);
  theme.emit("editor:change", { markdown: "a" });
  renderSpy.mockClear();

  theme.emit("editor:change", { markdown: "ab" });
  theme.emit("editor:change", { markdown: "abc" });
  expect(renderSpy).not.toHaveBeenCalled();

  vi.advanceTimersByTime(100);
  expect(renderSpy).toHaveBeenCalledTimes(1);

  preview.destroy();
  vi.useRealTimers();
  document.body.innerHTML = "";
});
