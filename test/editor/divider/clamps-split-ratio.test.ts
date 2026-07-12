/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import {
  createDividerTree,
  setupDividerTestGlobals,
  teardownDividerTest,
} from "./helpers.js";

it("clamps split ratio", () => {
  setupDividerTestGlobals();
  const { divider } = createDividerTree();

  divider.setSplit(0.05);
  expect(divider.getSplit()).toBe(0.15);

  divider.setSplit(0.95);
  expect(divider.getSplit()).toBe(0.85);

  divider.destroy();
  teardownDividerTest();
});
