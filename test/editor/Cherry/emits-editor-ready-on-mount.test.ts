/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createCherry } from "./helpers";

it("emits editor:ready on mount", async () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const handler = vi.fn();
  const cherry = createCherry();
  cherry.eventBus.on("editor:ready", handler);

  await Promise.resolve();
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0].el).toBeInstanceOf(HTMLElement);

  cherry.destroy();
});
