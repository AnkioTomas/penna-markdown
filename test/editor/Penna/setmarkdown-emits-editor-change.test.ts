/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createPenna } from "./helpers";

it("setMarkdown emits editor:change", () => {
  document.body.innerHTML = '<div id="penna-editor"></div>';
  const handler = vi.fn();
  const penna = createPenna({
    editor: { value: "a" },
  });
  penna.eventBus.on("editor:change", handler);
  handler.mockClear();

  penna.setMarkdown("b");

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ markdown: "b" }),
  );
  penna.destroy();
});
