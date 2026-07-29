/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { SIDEBAR_WIDTH_STORAGE_KEY } from "@/editor/sidebar/SideBarResizer";
import { createMemoryStorage } from "@/core/StorageAPI";
import {
  createSideBarResizerTree,
  setupSideBarResizerTestGlobals,
  teardownSideBarResizerTest,
} from "./helpers.js";

it("restores stored sidebar width on construction", () => {
  setupSideBarResizerTestGlobals();
  const storage = createMemoryStorage({
    [SIDEBAR_WIDTH_STORAGE_KEY]: "185",
  });
  const { resizer, sidebarEl } = createSideBarResizerTree(storage);

  expect(resizer.getWidth()).toBe(185);
  expect(sidebarEl.style.getPropertyValue("--penna-sidebar-width")).toBe(
    "185px",
  );

  resizer.destroy();
  teardownSideBarResizerTest();
});
