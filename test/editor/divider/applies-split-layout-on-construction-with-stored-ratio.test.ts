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

it("applies split layout on construction with stored ratio", () => {
  setupDividerTestGlobals();
  const storage = createMemoryStorage({ [SPLIT_STORAGE_KEY]: "0.5" });
  const { body, divider } = createDividerTree(storage, 1000, 200);

  expect(body.classList.contains("cherry-body--split")).toBe(true);
  expect(body.style.getPropertyValue("--cherry-editor-ratio")).toBe("5000");
  expect(body.style.getPropertyValue("--cherry-preview-ratio")).toBe("5000");
  expect(divider.getSplit()).toBe(0.5);

  divider.destroy();
  teardownDividerTest();
});
