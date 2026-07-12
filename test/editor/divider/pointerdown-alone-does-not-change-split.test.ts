/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createMemoryStorage } from "@/core/StorageAPI";
import {
  createDividerTree,
  setupDividerTestGlobals,
  teardownDividerTest,
} from "./helpers.js";

it("pointerdown alone does not change split", () => {
  setupDividerTestGlobals();
  const { divider, dividerEl } = createDividerTree(
    createMemoryStorage(),
    1000,
    200,
  );
  divider.setSplit(0.5);

  dividerEl.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: 900,
    }),
  );
  document.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, button: 0 }),
  );

  expect(divider.getSplit()).toBe(0.5);
  divider.destroy();
  teardownDividerTest();
});
