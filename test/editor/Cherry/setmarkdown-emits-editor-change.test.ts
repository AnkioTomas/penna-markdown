/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createCherry } from "./helpers";

it("setMarkdown emits editor:change", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const handler = vi.fn();
  const cherry = createCherry({
    editor: { value: "a" },
  });
  cherry.eventBus.on("editor:change", handler);
  handler.mockClear();

  cherry.setMarkdown("b");

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ markdown: "b" }),
  );
  cherry.destroy();
});
