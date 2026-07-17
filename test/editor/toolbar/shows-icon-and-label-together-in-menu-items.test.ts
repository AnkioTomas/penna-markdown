/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createTestEventBus } from "../../_helpers/eventBus";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

it("shows icon and label together in menu items", () => {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const eventBus = createTestEventBus();
  const toolbar = new Toolbar(mount, eventBus, {});

  const formatMenu = mount.querySelector('[data-toolbar-id="textFormat"]');
  const trigger = formatMenu?.querySelector(
    ".penna-toolbar-menu-trigger",
  ) as HTMLButtonElement;
  trigger?.click();

  expect(trigger?.querySelector("svg")).toBeTruthy();
  expect(trigger?.querySelector(".penna-toolbar-btn-label")?.textContent).toBe(
    "格式",
  );

  const boldItem = formatMenu?.querySelector('[data-toolbar-id="bold"]');
  expect(boldItem?.querySelector("svg")).toBeTruthy();
  expect(boldItem?.querySelector(".penna-toolbar-btn-label")?.textContent).toBe(
    "加粗",
  );

  toolbar.destroy();
});
