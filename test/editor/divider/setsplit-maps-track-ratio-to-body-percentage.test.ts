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

it("setSplit maps track ratio to body percentage", () => {
  setupDividerTestGlobals();
  const { body, divider } = createDividerTree(createMemoryStorage(), 1000, 200);

  divider.setSplit(0.7);

  expect(body.style.getPropertyValue("--penna-editor-ratio")).toBe("7000");
  expect(body.style.getPropertyValue("--penna-preview-ratio")).toBe("3000");
  expect(divider.getSplit()).toBe(0.7);
  divider.destroy();
  teardownDividerTest();
});
