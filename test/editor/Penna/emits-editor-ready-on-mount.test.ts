/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createPenna } from "./helpers";

it("emits editor:ready on mount", async () => {
  document.body.innerHTML = '<div id="penna-editor"></div>';
  const handler = vi.fn();
  const penna = createPenna();
  penna.eventBus.on("editor:ready", handler);

  await Promise.resolve();
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0].el).toBeInstanceOf(HTMLElement);

  penna.destroy();
});
