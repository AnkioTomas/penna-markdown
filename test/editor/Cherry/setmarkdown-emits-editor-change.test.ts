/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { Cherry } from "@/editor/Cherry";

function createCherry(options: Parameters<typeof Cherry>[1] = {}) {
  const mount = document.getElementById("cherry-editor")!;
  return new Cherry(mount, options);
}

it("setMarkdown emits editor:change", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const handler = vi.fn();
  const cherry = createCherry({
    id: "cherry-editor",
    editor: { value: "a" },
  });
  cherry.theme.on("editor:change", handler);
  handler.mockClear();

  cherry.setMarkdown("b");

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ markdown: "b" }),
  );
  cherry.destroy();
});
