/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createTestEventBus } from "../../_helpers/eventBus";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

it("shows footnote submenu under insert", () => {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const eventBus = createTestEventBus();
  const toolbar = new Toolbar(mount, eventBus, {});

  const insertMenu = mount.querySelector('[data-toolbar-id="insert"]');
  (
    insertMenu?.querySelector(
      ".penna-toolbar-menu-trigger",
    ) as HTMLButtonElement
  )?.click();
  expect(
    insertMenu?.querySelector('[data-toolbar-id="footnoteMenu"]'),
  ).toBeTruthy();

  toolbar.destroy();
});
