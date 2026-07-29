/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { SIDEBAR_WIDTH_STORAGE_KEY } from "@/editor/sidebar/SideBarResizer";
import { createMemoryStorage } from "@/core/StorageAPI";
import {
  createSideBarResizerTree,
  dragSideBarResizerTo,
  setupSideBarResizerTestGlobals,
  teardownSideBarResizerTest,
} from "./helpers.js";

it("persists sidebar width after drag", () => {
  setupSideBarResizerTestGlobals();
  const storage = createMemoryStorage();
  const { resizer, handleEl, sidebarEl } = createSideBarResizerTree(storage);

  dragSideBarResizerTo(handleEl, 210);

  expect(resizer.getWidth()).toBe(210);
  expect(sidebarEl.style.getPropertyValue("--penna-sidebar-width")).toBe(
    "210px",
  );
  expect(storage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)).toBe("210");

  resizer.destroy();
  teardownSideBarResizerTest();
});
