/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { SPLIT_STORAGE_KEY } from "@/editor/divider/Divider";
import { createMemoryStorage } from "@/core/StorageAPI";
import {
  createDividerTree,
  setupDividerTestGlobals,
  teardownDividerTest,
} from "./helpers.js";

it("persists split after drag", () => {
  setupDividerTestGlobals();
  const storage = createMemoryStorage();
  const { divider, dividerEl } = createDividerTree(storage, 1000, 200);

  dividerEl.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: 600,
    }),
  );
  document.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      button: 0,
      clientX: 700,
    }),
  );
  document.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, button: 0 }),
  );

  expect(storage.getItem(SPLIT_STORAGE_KEY)).not.toBeNull();
  divider.destroy();
  teardownDividerTest();
});
