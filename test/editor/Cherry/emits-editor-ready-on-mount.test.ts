/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { Cherry } from "@/editor/Cherry";

function createCherry(options: Parameters<typeof Cherry>[1] = {}) {
  const mount = document.getElementById("cherry-editor")!;
  return new Cherry(mount, options);
}

it("emits editor:ready on mount", async () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const handler = vi.fn();
  const cherry = createCherry({ id: "cherry-editor" });
  cherry.theme.on("editor:ready", handler);

  await Promise.resolve();
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0].id).toBe("cherry-editor");

  cherry.destroy();
});
