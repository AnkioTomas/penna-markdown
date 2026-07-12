/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Divider } from "@/editor/divider/Divider";
import { createTestEventBus } from "../../_helpers/eventBus";
import { createMemoryStorage } from "@/core/StorageAPI";
import { setupDividerTestGlobals, teardownDividerTest } from "./helpers.js";

it("rejects invalid DOM placement", () => {
  setupDividerTestGlobals();
  const mount = document.createElement("div");
  expect(
    () => new Divider(mount, createTestEventBus(), createMemoryStorage()),
  ).toThrow(/必须挂载/);
  teardownDividerTest();
});
