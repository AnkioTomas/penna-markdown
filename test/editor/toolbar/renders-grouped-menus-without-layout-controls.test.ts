/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createTestEventBus } from "../../_helpers/eventBus";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

it("renders grouped menus without layout controls", () => {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const eventBus = createTestEventBus();
  const toolbar = new Toolbar(mount, eventBus, {});

  expect(mount.querySelector(".cherry-toolbar-scroll")).toBeTruthy();
  expect(mount.querySelector(".cherry-toolbar-layout")).toBeFalsy();
  expect(mount.querySelector('[data-toolbar-id="themeMenu"]')).toBeTruthy();

  toolbar.destroy();
});
