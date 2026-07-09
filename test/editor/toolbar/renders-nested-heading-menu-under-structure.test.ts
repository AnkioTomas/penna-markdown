/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Theme } from "@/theme/Theme.js";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

it("renders nested heading menu under structure", () => {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const theme = new Theme();
  const toolbar = new Toolbar(mount, theme, {});

  const structureMenu = mount.querySelector('[data-toolbar-id="structure"]');
  expect(structureMenu).toBeTruthy();
  const trigger = structureMenu?.querySelector(
    ".cherry-toolbar-menu-trigger",
  ) as HTMLButtonElement;
  trigger?.click();
  expect(structureMenu?.classList.contains("is-open")).toBe(true);

  const headingMenu = structureMenu?.querySelector(
    '[data-toolbar-id="heading"]',
  );
  expect(headingMenu).toBeTruthy();
  expect(
    headingMenu?.querySelectorAll(".cherry-toolbar-menu-item").length,
  ).toBe(6);

  toolbar.destroy();
});
