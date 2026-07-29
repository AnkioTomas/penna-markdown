/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import {
  createSideBarResizerTree,
  dragSideBarResizerTo,
  setupSideBarResizerTestGlobals,
  teardownSideBarResizerTest,
} from "./helpers.js";

it("clamps sidebar width to min and max", () => {
  setupSideBarResizerTestGlobals();
  const { resizer, handleEl } = createSideBarResizerTree(undefined, 320);

  dragSideBarResizerTo(handleEl, 20);
  expect(resizer.getWidth()).toBe(160);

  dragSideBarResizerTo(handleEl, 900);
  expect(resizer.getWidth()).toBe(320);

  resizer.destroy();
  teardownSideBarResizerTest();
});
