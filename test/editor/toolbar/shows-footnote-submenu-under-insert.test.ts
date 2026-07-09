/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Theme } from "@/theme/Theme.js";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

it("shows footnote submenu under insert", () => {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const theme = new Theme();
  const toolbar = new Toolbar(mount, theme, {});

  const insertMenu = mount.querySelector('[data-toolbar-id="insert"]');
  (
    insertMenu?.querySelector(
      ".cherry-toolbar-menu-trigger",
    ) as HTMLButtonElement
  )?.click();
  expect(
    insertMenu?.querySelector('[data-toolbar-id="footnoteMenu"]'),
  ).toBeTruthy();

  toolbar.destroy();
});
