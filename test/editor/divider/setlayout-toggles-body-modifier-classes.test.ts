/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import {
  createDividerTree,
  setupDividerTestGlobals,
  teardownDividerTest,
} from "./helpers.js";

it("setLayout toggles body modifier classes", () => {
  setupDividerTestGlobals();
  const { body, divider } = createDividerTree();

  divider.setLayout("edit");
  expect(body.classList.contains("penna-body--edit")).toBe(true);
  expect(divider.getLayout()).toBe("edit");

  divider.setLayout("preview");
  expect(body.classList.contains("penna-body--preview")).toBe(true);

  divider.destroy();
  teardownDividerTest();
});
