/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import {
  createDividerTree,
  setupDividerTestGlobals,
  teardownDividerTest,
} from "./helpers.js";

it("setLayout emits editor:layout", () => {
  setupDividerTestGlobals();
  const { eventBus, divider } = createDividerTree();
  const handler = vi.fn();
  eventBus.on("editor:layout", handler);

  divider.setLayout("edit");

  expect(handler).toHaveBeenCalledWith({ mode: "edit", prev: "split" });
  divider.destroy();
  teardownDividerTest();
});
